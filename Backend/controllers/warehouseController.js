const WarehouseStructure = require('../models/WarehouseStructure');
const OccupierUnitMapping = require('../models/OccupierUnitMapping');
const User = require('../models/User');
const { createAuditLogFromReq } = require('../utils/auditHelper');

// @desc    Create structure element (PROJECT, BUILDING, FLOOR, UNIT)
// @route   POST /api/v1/warehouse/structure
// @access  Private/Admin
exports.createStructure = async (req, res) => {
  try {
    const { type, name, parentId } = req.body;

    // If parentId exists, verify it exists in DB
    if (parentId) {
      const parent = await WarehouseStructure.findById(parentId);
      if (!parent) {
        return res.status(404).json({ message: 'Parent structure not found' });
      }
    }

    const structure = await WarehouseStructure.create({
      type,
      name,
      parentId: parentId || null
    });

    // Audit structure creation
    createAuditLogFromReq(req, {
      action: 'ADMIN_CONFIG_CHANGE',
      entity: 'WarehouseStructure',
      entityId: structure._id,
      details: `Created ${type}: ${name}`,
      metadata: { type, name, parentId: parentId || null }
    });

    res.status(201).json(structure);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get all structure elements (as a list or flattened tree)
// @route   GET /api/v1/warehouse/structure
// @access  Private/Admin
exports.getStructure = async (req, res) => {
  try {
    const { parentId, type } = req.query;
    const filter = {};
    if (parentId) filter.parentId = parentId === 'null' ? null : parentId;
    if (type) filter.type = type;

    const structures = await WarehouseStructure.find(filter);
    res.json(structures);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Delete structure element
// @route   DELETE /api/v1/warehouse/structure/:id
// @access  Private/Admin
exports.deleteStructure = async (req, res) => {
  try {
    const structure = await WarehouseStructure.findById(req.params.id);
    if (!structure) {
      return res.status(404).json({ message: 'Structure not found' });
    }

    // Check if it has children
    const hasChildren = await WarehouseStructure.exists({ parentId: req.params.id });
    if (hasChildren) {
      return res.status(400).json({ message: 'Cannot delete structure with children' });
    }

    const type = structure.type;
    const name = structure.name;
    const structureId = structure._id;

    await structure.deleteOne();

    // Audit structure deletion
    createAuditLogFromReq(req, {
      action: 'ADMIN_CONFIG_CHANGE',
      entity: 'WarehouseStructure',
      entityId: structureId,
      details: `Deleted ${type}: ${name}`,
      metadata: { type, name }
    });

    res.json({ message: 'Structure removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Search for units
// @route   GET /api/v1/warehouse/search
// @access  Private
exports.searchUnits = async (req, res) => {
  try {
    const { q } = req.query;
    const filter = { type: 'UNIT' };
    if (q) filter.name = new RegExp(q, 'i');

    const units = await WarehouseStructure.find(filter).lean();
    
    // Enrich units with their full path (Building > Floor)
    const allStructures = await WarehouseStructure.find().lean();
    const structureMap = {};
    allStructures.forEach(s => structureMap[s._id] = s);

    const enrichedUnits = units.map(unit => {
      let path = [];
      let current = unit;
      while (current && current.parentId) {
        const parent = structureMap[current.parentId];
        if (parent) {
          path.unshift(parent.name);
          current = parent;
        } else {
          break;
        }
      }
      return { 
        ...unit, 
        fullName: unit.name,
        path: path.join(' > ') 
      };
    });

    res.json(enrichedUnits);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Map an occupier to a unit
// @route   POST /api/v1/warehouse/mapping
// @access  Private/Admin
exports.mapOccupierToUnit = async (req, res) => {
  try {
    const { occupierId, unitId } = req.body;

    // Verify user is an OCCUPIER
    const user = await User.findById(occupierId);
    if (!user || user.role !== 'OCCUPIER') {
      return res.status(400).json({ message: 'Valid occupier ID required' });
    }

    // Verify unit exists and is of type UNIT
    const unit = await WarehouseStructure.findById(unitId);
    if (!unit || unit.type !== 'UNIT') {
      return res.status(400).json({ message: 'Valid unit ID required' });
    }

    // Check for existing mapping
    const existingMapping = await OccupierUnitMapping.findOne({ unitId, status: 'ACTIVE' });
    if (existingMapping) {
       // If occupier is different, we might want to deactivate old or error
       if (existingMapping.occupierId.toString() !== occupierId) {
         return res.status(400).json({ message: 'Unit is already mapped to another occupier' });
       }
       return res.status(400).json({ message: 'Occupier is already mapped to this unit' });
    }

    const mapping = await OccupierUnitMapping.create({
      occupierId,
      unitId
    });

    // Audit mapping creation
    createAuditLogFromReq(req, {
      action: 'ADMIN_CONFIG_CHANGE',
      entity: 'OccupierUnitMapping',
      entityId: mapping._id,
      details: `Mapped occupier ${user.email} to unit ${unit.name}`,
      metadata: { occupierEmail: user.email, unitName: unit.name }
    });

    res.status(201).json(mapping);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get all mappings
// @route   GET /api/v1/warehouse/mapping
// @access  Private/Admin
exports.getMappings = async (req, res) => {
  try {
    const mappings = await OccupierUnitMapping.find()
      .populate('occupierId', 'name email phone')
      .populate('unitId', 'name type parentId');
    
    // Enhance mappings with parents
    const allStructures = await WarehouseStructure.find().lean();
    const structureMap = {};
    allStructures.forEach(s => structureMap[s._id] = s);

    const enhancedMappings = mappings.map(m => {
      const mappingObj = m.toObject();
      if (mappingObj.unitId) {
        let parent = structureMap[mappingObj.unitId.parentId];
        mappingObj.unitId.parentName = parent ? parent.name : '';
      }
      return mappingObj;
    });

    res.json(enhancedMappings);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};
