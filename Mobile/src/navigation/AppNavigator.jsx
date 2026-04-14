import React from 'react';
import { createGlobalStyle } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, List, User, ShieldCheck } from 'lucide-react-native';

import { COLORS } from '../theme/DesignSystem';

// Auth Screens
import LoginScreen from '../screens/Auth/LoginScreen';

// Guard Screens
import DashboardScreen from '../screens/Guard/DashboardScreen';
import VehicleEntryScreen from '../screens/Guard/VehicleEntryScreen';
import OccupierSearchScreen from '../screens/Guard/OccupierSearchScreen';
import PendingApprovalsScreen from '../screens/Guard/PendingApprovalsScreen';
import VehicleExitScreen from '../screens/Guard/VehicleExitScreen';
import PaymentCollectionScreen from '../screens/Guard/PaymentCollectionScreen';
import HistoryScreen from '../screens/Guard/HistoryScreen';
import SiteMapScreen from '../screens/Guard/SiteMapScreen';

// Occupier Screens
import OccupierDashboard from '../screens/Occupier/DashboardScreen';
import OccupierApprovals from '../screens/Occupier/ApprovalsScreen';
import OccupierHistory from '../screens/Occupier/HistoryScreen';
import UnitDetails from '../screens/Occupier/UnitDetailsScreen';

// Admin Screens
import AdminDashboardScreen from '../screens/Admin/AdminDashboardScreen';
import UserManagementScreen from '../screens/Admin/UserManagementScreen';
import WarehouseMappingScreen from '../screens/Admin/WarehouseMappingScreen';
import VehicleLogsScreen from '../screens/Admin/VehicleLogsScreen';
import ApprovalLogsScreen from '../screens/Admin/ApprovalLogsScreen';
import ReportsScreen from '../screens/Admin/ReportsScreen';
import ParkingConfigScreen from '../screens/Admin/ParkingConfigScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function GuardTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.gray400,
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: COLORS.gray100,
          paddingBottom: 8,
          paddingTop: 8,
          height: 64,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
        },
        headerStyle: {
          backgroundColor: COLORS.primary,
        },
        headerTintColor: COLORS.white,
        headerTitleStyle: {
          fontWeight: '800',
        },
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={DashboardScreen} 
        options={{
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
          title: 'GateSync',
        }}
      />
      <Tab.Screen 
        name="Logs" 
        component={HistoryScreen} 
        options={{
          tabBarIcon: ({ color, size }) => <List color={color} size={size} />,
          title: 'Activity Logs',
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={() => null} // Mock profile
        options={{
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
          title: 'Security Profile',
        }}
      />
    </Tab.Navigator>
  );
}

function OccupierTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.gray400,
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: COLORS.gray100,
          paddingBottom: 8,
          paddingTop: 8,
          height: 64,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
        },
        headerStyle: {
          backgroundColor: COLORS.white,
        },
        headerTintColor: COLORS.gray900,
        headerTitleStyle: {
          fontWeight: '800',
        },
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={OccupierDashboard} 
        options={{
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
          headerShown: false,
        }}
      />
      <Tab.Screen 
        name="Approvals" 
        component={OccupierApprovals} 
        options={{
          tabBarIcon: ({ color, size }) => <ShieldCheck color={color} size={size} />,
          title: 'My Approvals',
        }}
      />
      <Tab.Screen 
        name="History" 
        component={OccupierHistory} 
        options={{
          tabBarIcon: ({ color, size }) => <List color={color} size={size} />,
          title: 'Vehicle History',
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={UnitDetails} 
        options={{
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
          title: 'Unit Details',
        }}
      />
    </Tab.Navigator>
  );
}

function AdminTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.gray400,
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: COLORS.gray100,
          paddingBottom: 8,
          paddingTop: 8,
          height: 64,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
        },
        headerStyle: {
          backgroundColor: COLORS.white,
        },
        headerTintColor: COLORS.gray900,
        headerTitleStyle: {
          fontWeight: '800',
        },
      }}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={AdminDashboardScreen} 
        options={{
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
          headerShown: false,
        }}
      />
      <Tab.Screen 
        name="Users" 
        component={UserManagementScreen} 
        options={{
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
          title: 'User Control',
        }}
      />
      <Tab.Screen 
        name="Logs" 
        component={VehicleLogsScreen} 
        options={{
          tabBarIcon: ({ color, size }) => <List color={color} size={size} />,
          title: 'Global Logs',
        }}
      />
      <Tab.Screen 
        name="Reports" 
        component={ReportsScreen} 
        options={{
          tabBarIcon: ({ color, size }) => <ShieldCheck color={color} size={size} />,
          title: 'Site Reports',
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        
        {/* Protected Guard Routes */}
        <Stack.Screen name="GuardMain" component={GuardTabs} />
        
        {/* Protected Occupier Routes */}
        <Stack.Screen name="OccupierMain" component={OccupierTabs} />

        {/* Protected Admin Routes */}
        <Stack.Screen name="AdminMain" component={AdminTabs} />
        
        {/* Shared / Modal Screens */}
        <Stack.Screen 
          name="WarehouseMapping" 
          component={WarehouseMappingScreen} 
          options={{ headerShown: true, title: 'Map View' }} 
        />
        <Stack.Screen 
          name="ApprovalLogs" 
          component={ApprovalLogsScreen} 
          options={{ headerShown: true, title: 'Consent Stream' }} 
        />
        
        {/* Modal-like flows for Guard */}
        <Stack.Screen 
          name="VehicleEntry" 
          component={VehicleEntryScreen} 
          options={{ headerShown: true, title: 'New Entry', headerStyle: { backgroundColor: COLORS.white }, headerTintColor: COLORS.gray900 }} 
        />
        <Stack.Screen 
          name="SiteMap" 
          component={SiteMapScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="OccupierSearch" 
          component={OccupierSearchScreen} 
          options={{ headerShown: true, title: 'Map Destination' }} 
        />
        <Stack.Screen 
          name="PendingApprovals" 
          component={PendingApprovalsScreen} 
          options={{ headerShown: true, title: 'Approval Status' }} 
        />
        <Stack.Screen 
          name="VehicleExit" 
          component={VehicleExitScreen} 
          options={{ headerShown: true, title: 'Vehicle Exit' }} 
        />
        <Stack.Screen 
          name="PaymentCollection" 
          component={PaymentCollectionScreen} 
          options={{ headerShown: true, title: 'Collect Payment' }} 
        />
        <Stack.Screen 
          name="ParkingConfig" 
          component={ParkingConfigScreen} 
          options={{ headerShown: true, title: 'Revenue Nodes', headerStyle: { backgroundColor: COLORS.white }, headerTintColor: COLORS.gray900 }} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
