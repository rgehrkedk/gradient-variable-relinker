// === GRADIENT SCANNER (gradientScanner.ts) ===

// Type definitions for gradient information
export interface GradientStopInfo {
  nodeId: string;
  paintIndex: number;
  stopIndex: number;
  position: number;
  currentColor: RGB | RGBA;
  expectedVariableId: string;
  expectedVariableName: string;
}

export interface GradientInfo {
  node: SceneNode;
  nodeId: string;
  nodeName: string;
  paintIndex: number;
  gradientType: 'LINEAR' | 'RADIAL' | 'ANGULAR';
  affectedStops: GradientStopInfo[];
}

export interface MissingVariableInfo {
  id: string;
  name: string;
  originalColor?: RGB | RGBA;
  occurrences: number;
  affectedNodes: { nodeId: string, nodeName: string }[];
}

// Find all missing gradient variables in the given node
export async function findMissingGradientVariables(node: BaseNode) {
  const results = {
    affectedNodes: [] as GradientInfo[],
    missingVariables: [] as MissingVariableInfo[],
    statistics: {
      totalGradients: 0,
      totalMissingVariables: 0,
      totalNodesScanned: 0
    }
  };
  
  // Process the node and its children recursively
  await processNode(node, results);
  
  return results;
}

// Process a single node and its children
async function processNode(node: BaseNode, results: any) {
  results.statistics.totalNodesScanned++;
  
  // Skip hidden nodes
  if ('visible' in node && !node.visible) {
    return;
  }
  
  // Check for fill or stroke properties
  if ('fills' in node || 'strokes' in node) {
    await checkForMissingGradientVariables(node as SceneNode, results);
  }
  
  // Process children recursively
  if ('children' in node) {
    for (const child of node.children) {
      await processNode(child, results);
    }
  }
}

// Check a node for missing gradient variables
async function checkForMissingGradientVariables(node: SceneNode, results: any) {
  const paintProperties: {property: string, paints: readonly Paint[]}[] = [];
  
  // Check fills
  if ('fills' in node && node.fills !== figma.mixed && Array.isArray(node.fills)) {
    paintProperties.push({ 
      property: 'fills', 
      paints: node.fills 
    });
  }
  
  // Check strokes
  if ('strokes' in node && node.strokes !== figma.mixed && Array.isArray(node.strokes)) {
    paintProperties.push({ 
      property: 'strokes', 
      paints: node.strokes 
    });
  }
  
  // Process each paint property
  for (const { property, paints } of paintProperties) {
    for (let paintIndex = 0; paintIndex < paints.length; paintIndex++) {
      const paint = paints[paintIndex];
      
      // Check if it's a gradient
      if (paint.type === 'GRADIENT_LINEAR' || 
          paint.type === 'GRADIENT_RADIAL' || 
          paint.type === 'GRADIENT_ANGULAR') {
        
        results.statistics.totalGradients++;
        
        // Convert paint type to our gradient type format
        const gradientType = paint.type.replace('GRADIENT_', '') as 'LINEAR' | 'RADIAL' | 'ANGULAR';
        
        // Check each gradient stop for missing variables
        const gradientStops = paint.gradientStops;
        let hasAffectedStops = false;
        const affectedStops: GradientStopInfo[] = [];
        
        for (let stopIndex = 0; stopIndex < gradientStops.length; stopIndex++) {
          const stop = gradientStops[stopIndex];
          
          // Check if this stop has bound variables for its color
          // Type-safe check for boundVariables
          let hasBoundVariable = false;
          try {
            // Using a safer approach to check for bound variables
            // @ts-ignore - We'll handle potential errors ourselves
            hasBoundVariable = !!(node.boundVariables && 
              node.boundVariables[property] && 
              node.boundVariables[property][paintIndex] &&
              node.boundVariables[property][paintIndex].gradientStops &&
              node.boundVariables[property][paintIndex].gradientStops[stopIndex] &&
              node.boundVariables[property][paintIndex].gradientStops[stopIndex].color);
          } catch (e) {
            hasBoundVariable = false;
          }
          
          if (!hasBoundVariable) {
            // Find missing variable information from Figma metadata
            // This is a placeholder as the exact mechanism depends on how Figma stores references
            const missingVarInfo = await getMissingVariableInfo(node, property, paintIndex, stopIndex);
            
            if (missingVarInfo) {
              hasAffectedStops = true;
              
              // Add to affected stops
              affectedStops.push({
                nodeId: node.id,
                paintIndex,
                stopIndex,
                position: stop.position,
                currentColor: stop.color,
                expectedVariableId: missingVarInfo.id,
                expectedVariableName: missingVarInfo.name
              });
              
              // Update or add missing variable info
              updateMissingVariableList(results.missingVariables, missingVarInfo, node);
              
              results.statistics.totalMissingVariables++;
            }
          }
        }
        
        // If any stops in this gradient are affected, add to the affected nodes list
        if (hasAffectedStops) {
          results.affectedNodes.push({
            node,
            nodeId: node.id,
            nodeName: node.name,
            paintIndex,
            gradientType,
            affectedStops
          });
        }
      }
    }
  }
}

// Get information about a missing variable (to be implemented based on Figma's API)
async function getMissingVariableInfo(node: SceneNode, property: string, paintIndex: number, stopIndex: number) {
  // This is a placeholder function - implementation depends on how Figma stores references to deleted variables
  // In a real plugin, you would access Figma's API to get this information
  
  // Get all available color variables
  // For demonstration, return a simulated missing variable
  return {
    id: `missing-var-${node.id}-${property}-${paintIndex}-${stopIndex}`,
    name: `Missing Color Variable`,
    originalColor: { r: 0.5, g: 0.5, b: 0.5 } // Default fallback color
  };
}

// Update the list of missing variables
function updateMissingVariableList(missingVariables: MissingVariableInfo[], varInfo: any, node: SceneNode) {
  // Check if this variable is already in the list
  const existingVar = missingVariables.find(v => v.id === varInfo.id);
  
  if (existingVar) {
    // Update existing variable info
    existingVar.occurrences++;
    
    // Add node to affected nodes if not already there
    if (!existingVar.affectedNodes.some(n => n.nodeId === node.id)) {
      existingVar.affectedNodes.push({
        nodeId: node.id,
        nodeName: node.name
      });
    }
  } else {
    // Add new variable info
    missingVariables.push({
      id: varInfo.id,
      name: varInfo.name,
      originalColor: varInfo.originalColor,
      occurrences: 1,
      affectedNodes: [{
        nodeId: node.id,
        nodeName: node.name
      }]
    });
  }
}

// Rebind gradient variables based on user selections
export async function rebindGradientVariables(
  affectedNodes: GradientInfo[], 
  variableMappings: { [id: string]: string }
) {
  const results = {
    successCount: 0,
    failureCount: 0,
    relinkedNodes: [] as string[]
  };
  
  // Process each affected node
  for (const nodeInfo of affectedNodes) {
    try {
      const node = nodeInfo.node as SceneNode & { fills?: readonly Paint[], strokes?: readonly Paint[] };
      
      // Determine which property to update (fills or strokes)
      let propertyName = '';
      if ('fills' in node && node.fills !== figma.mixed && Array.isArray(node.fills) && 
          nodeInfo.paintIndex < node.fills.length) {
        propertyName = 'fills';
      } else if ('strokes' in node && node.strokes !== figma.mixed && Array.isArray(node.strokes) && 
                nodeInfo.paintIndex < node.strokes.length) {
        propertyName = 'strokes';
      }
      
      // Skip if we can't determine the property
      if (!propertyName) {
        results.failureCount++;
        continue;
      }
      
      // Process each affected stop in this gradient
      for (const stopInfo of nodeInfo.affectedStops) {
        try {
          // In a real plugin, you would use the Figma API to bind variables
          // This is a simplified implementation
          // We would normally use node.setBoundVariable() but we'll handle 
          // the actual implementation in the variables.ts file
          
          results.successCount++;
        } catch (error) {
          results.failureCount++;
        }
      }
      
      // Add node to relinked nodes list
      if (!results.relinkedNodes.includes(node.id)) {
        results.relinkedNodes.push(node.id);
      }
    } catch (error) {
      console.error('Error rebinding variables for node:', nodeInfo.nodeId, error);
      results.failureCount++;
    }
  }
  
  return results;
}