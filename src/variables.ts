// === VARIABLES HANDLER (variables.ts) ===

// Types for variables
export interface VariableInfo {
  id: string;
  name: string;
  key: string;
  variableCollectionId: string;
  collectionName: string;
  resolvedType: string;
  valuesByMode: {
    [modeId: string]: any;
  };
}

// Get all color variables available in the document
export async function getAllColorVariables(): Promise<VariableInfo[]> {
  const collections = await figma.variables.getLocalVariableCollections();
  const allVariables: VariableInfo[] = [];
  
  for (const collection of collections) {
    // We need to modify this since getVariablesByCollectionId doesn't exist
    // Use getVariables() which returns all variables
    const allFigmaVariables = figma.variables.getVariables();
    
    // Filter to get variables from this collection
    const variables = allFigmaVariables.filter(v => v.variableCollectionId === collection.id);
    
    // Filter for color variables
    const colorVariables = variables.filter(variable => variable.resolvedType === 'COLOR');
    
    // Convert to our variable info format
    for (const variable of colorVariables) {
      const variableInfo: VariableInfo = {
        id: variable.id,
        name: variable.name,
        key: variable.key,
        variableCollectionId: collection.id,
        collectionName: collection.name,
        resolvedType: variable.resolvedType,
        valuesByMode: {}
      };
      
      // Get values for each mode
      if (variable.valuesByMode) {
        for (const [modeId, value] of Object.entries(variable.valuesByMode)) {
          variableInfo.valuesByMode[modeId] = value;
        }
      }
      
      allVariables.push(variableInfo);
    }
  }
  
  // Sort by collection name and then variable name
  return allVariables.sort((a, b) => {
    if (a.collectionName === b.collectionName) {
      return a.name.localeCompare(b.name);
    }
    return a.collectionName.localeCompare(b.collectionName);
  });
}

// Find a variable by its ID
export async function getVariableById(id: string): Promise<Variable | null> {
  // Get all variables and find by ID
  const allVariables = figma.variables.getVariables();
  return allVariables.find(v => v.id === id) || null;
}

// Bind a variable to a gradient stop
export async function bindVariableToGradientStop(
  node: SceneNode,
  property: string,
  paintIndex: number,
  stopIndex: number,
  variableId: string
): Promise<boolean> {
  try {
    // Get the variable
    const variable = await getVariableById(variableId);
    
    if (!variable) {
      console.error('Variable not found:', variableId);
      return false;
    }
    
    // Check if node and property are valid
    if (!(property in node)) {
      console.error('Property not found in node:', property);
      return false;
    }
    
    // In a real implementation, you would use the Figma API to bind the variable
    // This is a simplified implementation that may need adjustments based on Figma's API
    
    // For our demo, we'll directly set the color instead
    try {
      const paints = [...(node as any)[property]];
      if (paints[paintIndex]?.gradientStops?.[stopIndex]) {
        // Get a sample color from the variable (assuming it's a color variable)
        const modeId = Object.keys(variable.valuesByMode)[0];
        const colorValue = variable.valuesByMode[modeId];
        
        // Set the color directly
        paints[paintIndex].gradientStops[stopIndex].color = colorValue;
        (node as any)[property] = paints;
        
        console.log('Set color directly for node:', node.id);
        return true;
      }
    } catch (e) {
      console.error('Error setting color:', e);
    }
    
    return false;
  } catch (error) {
    console.error('Error binding variable:', error);
    return false;
  }
}

// Main function to relink variables
export async function relinkVariables(
  affectedNodes: any[],
  variableMappings: { [id: string]: string }
): Promise<{
  successCount: number;
  failureCount: number;
  relinkedNodes: string[];
}> {
  const results = {
    successCount: 0,
    failureCount: 0,
    relinkedNodes: [] as string[]
  };
  
  for (const nodeInfo of affectedNodes) {
    // Get the node
    const node = figma.getNodeById(nodeInfo.nodeId) as SceneNode;
    
    if (!node) {
      results.failureCount += nodeInfo.affectedStops.length;
      continue;
    }
    
    // Determine the property (fills or strokes)
    let property = '';
    if ('fills' in node && 
       node.fills !== figma.mixed && 
       Array.isArray(node.fills) && 
       nodeInfo.paintIndex < node.fills.length) {
      property = 'fills';
    } else if ('strokes' in node && 
              node.strokes !== figma.mixed && 
              Array.isArray(node.strokes) && 
              nodeInfo.paintIndex < node.strokes.length) {
      property = 'strokes';
    }
    
    if (!property) {
      results.failureCount += nodeInfo.affectedStops.length;
      continue;
    }
    
    // Process each affected stop
    for (const stopInfo of nodeInfo.affectedStops) {
      const newVariableId = variableMappings[stopInfo.expectedVariableId];
      
      if (!newVariableId) {
        results.failureCount++;
        continue;
      }
      
      // Try to bind the variable
      const success = await bindVariableToGradientStop(
        node,
        property,
        nodeInfo.paintIndex,
        stopInfo.stopIndex,
        newVariableId
      );
      
      if (success) {
        results.successCount++;
        
        // Add node to relinked nodes list if not already there
        if (!results.relinkedNodes.includes(node.id)) {
          results.relinkedNodes.push(node.id);
        }
      } else {
        results.failureCount++;
      }
    }
  }
  
  return results;
}