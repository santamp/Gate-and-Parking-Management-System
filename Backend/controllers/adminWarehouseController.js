const WarehouseStructure = require('../models/WarehouseStructure');
const OccupierUnitMapping = require('../models/OccupierUnitMapping');
const VehicleLog = require('../models/VehicleLog');
const { createAuditLogFromReq } = require('../utils/auditHelper');
const { getIo } = require('../utils/socket');

// @desc    Get full warehouse hierarchy
// @route   GET /api/v1/admin/warehouse/hierarchy
// @access  Private/Admin
exports.getHierarchy = async (req, res) => {
  try {
    // Fetch all structures, active mappings, and active vehicle sessions
    const [allStructures, activeMappings, activeVehicles] = await Promise.all([
      WarehouseStructure.find().lean(),
      OccupierUnitMapping.find({ status: 'ACTIVE' }).populate('occupierId', 'name email phone').lean(),
      VehicleLog.find({ status: { $in: ['pending', 'approved', 'inside'] } }).lean()
    ]);

    const occupiedUnitIds = new Set(activeMappings.map(m => m.unitId.toString()));
    
    // Create a map from occupierId to active vehicles
    const occupierVehicleMap = {};
    activeVehicles.forEach(v => {
      const occId = v.occupierMappedId.toString();
      if (!occupierVehicleMap[occId]) occupierVehicleMap[occId] = [];
      occupierVehicleMap[occId].push(v);
    });

    // Create a map of UnitID to detailed mapping and vehicle info
    const unitDetailedInfoMap = {};
    activeMappings.forEach(m => {
      const unitIdStr = m.unitId._id ? m.unitId._id.toString() : m.unitId.toString();
      const vehicles = occupierVehicleMap[m.occupierId?._id?.toString() || m.occupierId?.toString()] || [];
      
      unitDetailedInfoMap[unitIdStr] = {
        occupier: m.occupierId,
        vehicles: vehicles.map(v => ({
          _id: v._id,
          vehicleNumber: v.vehicleNumber,
          status: v.status,
          vehicleType: v.vehicleType,
          entryTime: v.entryTime
        }))
      };
    });

    // Map to build tree
    const structureMap = {};
    allStructures.forEach(s => {
      const unitInfo = unitDetailedInfoMap[s._id.toString()] || null;
      structureMap[s._id] = { 
        ...s, 
        children: [], 
        isOccupied: s.type === 'UNIT' ? occupiedUnitIds.has(s._id.toString()) : false,
        occupier: unitInfo ? unitInfo.occupier : null,
        activeVehicles: unitInfo ? unitInfo.vehicles : []
      };
    });

    const hierarchy = [];

    allStructures.forEach(s => {
      if (s.parentId) {
        const parent = structureMap[s.parentId];
        if (parent) {
          parent.children.push(structureMap[s._id]);
        }
      } else if (s.type === 'PROJECT') {
        hierarchy.push(structureMap[s._id]);
      }
    });

    res.json(hierarchy);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Create warehouse structure (Project/Building/Floor/Unit)
// @route   POST /api/v1/admin/warehouse/structure
// @access  Private/Admin
exports.createStructure = async (req, res) => {
  try {
    const { name, type, parentId } = req.body;

    if (!name || !type) {
      return res.status(400).json({ message: 'Name and type are required' });
    }

    // Verify parent if provided
    if (parentId) {
      const parent = await WarehouseStructure.findById(parentId);
      if (!parent) {
        return res.status(404).json({ message: 'Parent structure not found' });
      }
    }

    const structure = await WarehouseStructure.create({
      name,
      type: type.toUpperCase(),
      parentId: parentId || null
    });

    // Audit
    createAuditLogFromReq(req, {
      action: 'ADMIN_CONFIG_CHANGE',
      entity: 'WarehouseStructure',
      entityId: structure._id,
      details: `Created ${type}: ${name}`,
      metadata: { type, name, parentId: parentId || null }
    });

    try { getIo().emit('structure_updated'); } catch (e) { console.error(e); }

    res.status(201).json(structure);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Bulk provision project with floors and units
// @route   POST /api/v1/admin/warehouse/provision-project
// @access  Private/Admin
exports.provisionProject = async (req, res) => {
  try {
    const { projectName, numFloors, unitsPerFloor, autoGenerateUnits } = req.body;

    const floorsCount = parseInt(numFloors) || 1;
    const unitsCount = parseInt(unitsPerFloor) || 1;

    if (!projectName) {
      return res.status(400).json({ message: 'Project name is required' });
    }

    // 1. Create Project
    const project = await WarehouseStructure.create({
      name: projectName,
      type: 'PROJECT',
      parentId: null
    });

    // 2. Create Floors linked directly to Project
    for (let f = 1; f <= floorsCount; f++) {
      const floor = await WarehouseStructure.create({
        name: `Floor ${f}`,
        type: 'FLOOR',
        parentId: project._id
      });

      // 3. Create Units (Auto-generate)
      if (autoGenerateUnits) {
        for (let u = 1; u <= unitsCount; u++) {
          // Naming convention: FloorNum + padded UnitNum (e.g., 101, 205)
          const unitName = `${f}${u.toString().padStart(2, '0')}`;
          await WarehouseStructure.create({
            name: unitName,
            type: 'UNIT',
            parentId: floor._id
          });
        }
      }
    }

    // Audit
    createAuditLogFromReq(req, {
      action: 'ADMIN_CONFIG_CHANGE',
      entity: 'WarehouseStructure',
      entityId: project._id,
      details: `Provisioned project: ${projectName} with ${floorsCount} floors`,
      metadata: { projectName, numFloors: floorsCount, unitsPerFloor: unitsCount, autoGenerateUnits }
    });

    try { getIo().emit('structure_updated'); } catch (e) { console.error(e); }

    res.status(201).json({ message: 'Project and infrastructure successfully provisioned', project });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};
// @desc    Delete warehouse structure (and its children recursively)
// @route   DELETE /api/v1/admin/warehouse/structure/:id
// @access  Private/Admin
exports.deleteStructure = async (req, res) => {
  try {
    const { id } = req.params;

    const structure = await WarehouseStructure.findById(id);
    if (!structure) {
      return res.status(404).json({ message: 'Structure not found' });
    }

    // Recursive deletion function
    const deleteRecursive = async (parentId) => {
      const children = await WarehouseStructure.find({ parentId });
      for (const child of children) {
        await deleteRecursive(child._id);
      }
      await WarehouseStructure.deleteOne({ _id: parentId });
    };

    await deleteRecursive(id);

    // Audit
    createAuditLogFromReq(req, {
      action: 'ADMIN_CONFIG_CHANGE',
      entity: 'WarehouseStructure',
      entityId: id,
      details: `Deleted ${structure.type}: ${structure.name} (and all children)`,
      metadata: { type: structure.type, name: structure.name, id }
    });

    try { getIo().emit('structure_updated'); } catch (e) { console.error(e); }

    res.json({ message: 'Structure and all children deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};
