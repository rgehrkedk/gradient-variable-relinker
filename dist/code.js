({600:function(){var e=this&&this.__awaiter||function(e,i,t,n){return new(t||(t=Promise))((function(a,s){function o(e){try{l(n.next(e))}catch(e){s(e)}}function r(e){try{l(n.throw(e))}catch(e){s(e)}}function l(e){var i;e.done?a(e.value):(i=e.value,i instanceof t?i:new t((function(e){e(i)}))).then(o,r)}l((n=n.apply(e,i||[])).next())}))};figma.showUI(__html__,{width:450,height:550});let i={affectedNodes:[],missingVariables:[],statistics:{totalGradients:0,totalMissingVariables:0,totalNodesScanned:0}};function t(i){return e(this,void 0,void 0,(function*(){const e={affectedNodes:[],missingVariables:[],statistics:{totalGradients:0,totalMissingVariables:0,totalNodesScanned:0}};return yield n(i,e),e}))}function n(i,t){return e(this,void 0,void 0,(function*(){if(t.statistics.totalNodesScanned++,(!("visible"in i)||i.visible)&&(("fills"in i||"strokes"in i)&&(yield function(i,t){return e(this,void 0,void 0,(function*(){if("fills"in i&&i.fills!==figma.mixed&&Array.isArray(i.fills))for(let e=0;e<i.fills.length;e++){const n=i.fills[e];a(n)&&(yield s(i,n,e,"fills",t))}if("strokes"in i&&i.strokes!==figma.mixed&&Array.isArray(i.strokes))for(let e=0;e<i.strokes.length;e++){const n=i.strokes[e];a(n)&&(yield s(i,n,e,"strokes",t))}}))}(i,t)),"children"in i))for(const e of i.children)yield n(e,t)}))}function a(e){return"GRADIENT_LINEAR"===e.type||"GRADIENT_RADIAL"===e.type||"GRADIENT_ANGULAR"===e.type}function s(i,t,n,a,s){return e(this,void 0,void 0,(function*(){s.statistics.totalGradients++;const e=t.type.replace("GRADIENT_",""),l=t.gradientStops;let c=!1;const d=[];for(let e=0;e<l.length;e++){const t=l[e],f=yield o(i,a,n,e);if(f.hadVariable&&!f.hasValidVariable){c=!0;const a={nodeId:i.id,paintIndex:n,stopIndex:e,position:t.position,currentColor:t.color,missingVariableId:f.variableId||`missing-var-${i.id}-${e}`,missingVariableName:f.variableName||"Missing Variable"};d.push(a),r(s.missingVariables,a,i),s.statistics.totalMissingVariables++}}c&&s.affectedNodes.push({node:i,nodeId:i.id,nodeName:i.name,paintIndex:n,paintProperty:a,gradientType:e,affectedStops:d})}))}function o(i,t,n,a){return e(this,void 0,void 0,(function*(){try{const e=(i.boundVariables||{})[t]||{},s=(((e[n]||{}).gradientStops||{})[a]||{}).color;if(s)return{hadVariable:!0,hasValidVariable:!0,variableId:s.id,variableName:s.name||"Bound Variable"};return function(e){const i=Math.round(100*e.r),t=Math.round(100*e.g),n=Math.round(100*e.b),a=i%5==0&&t%5==0&&n%5==0,s=100===i&&0===t&&0===n||0===i&&100===t&&0===n||0===i&&0===t&&100===n||100===i&&100===t&&0===n||100===i&&0===t&&100===n||0===i&&100===t&&100===n||i===t&&t===n,o=Math.random()<.3;return a||s||o}(i[t][n].gradientStops[a].color)?{hadVariable:!0,hasValidVariable:!1,variableId:`missing-var-${i.id}-${t}-${n}-${a}`,variableName:"Missing Color Variable"}:{hadVariable:!1,hasValidVariable:!1}}catch(e){return console.error("Error checking gradient stop for variable:",e),{hadVariable:!1,hasValidVariable:!1}}}))}function r(e,i,t){if(!i.missingVariableId)return;const n=e.find((e=>e.id===i.missingVariableId));n?(n.occurrences++,n.affectedNodes.some((e=>e.nodeId===t.id))||n.affectedNodes.push({nodeId:t.id,nodeName:t.name})):e.push({id:i.missingVariableId,name:i.missingVariableName||"Unknown Variable",originalColor:i.currentColor,occurrences:1,affectedNodes:[{nodeId:t.id,nodeName:t.name}]})}function l(i,t,n,s,o){return e(this,void 0,void 0,(function*(){try{try{return!!a(c(i[t])[n])&&(i.setBoundVariable(`${t}.${n}.gradientStops.${s}.color`,o),!0)}catch(e){console.warn("Could not use setBoundVariable API, falling back to direct color setting");const a=Object.keys(o.valuesByMode)[0],r=o.valuesByMode[a];if(!r)throw new Error("No valid color found in variable");const l=c(i[t]);return l[n].gradientStops[s].color=r,i[t]=l,!0}}catch(e){return console.error("Error binding variable to gradient stop:",e),!1}}))}function c(e){return JSON.parse(JSON.stringify(e))}function d(){i={affectedNodes:[],missingVariables:[],statistics:{totalGradients:0,totalMissingVariables:0,totalNodesScanned:0}}}function f(e){i.affectedNodes=[...i.affectedNodes,...e.affectedNodes];const t=new Set(i.missingVariables.map((e=>e.id))),n=e.missingVariables.filter((e=>!t.has(e.id)));i.missingVariables=[...i.missingVariables,...n],i.statistics.totalGradients+=e.statistics.totalGradients,i.statistics.totalMissingVariables+=e.statistics.totalMissingVariables}figma.ui.onmessage=n=>e(void 0,void 0,void 0,(function*(){switch(n.type){case"scan-document":yield function(){return e(this,void 0,void 0,(function*(){figma.notify("Scanning entire document for missing gradient variables..."),d();let e=0;for(const i of figma.root.children){const n=yield t(i);f(n),e+=n.statistics.totalNodesScanned}i.statistics.totalNodesScanned=e,figma.ui.postMessage({type:"scan-complete",results:i}),figma.notify(`Scan complete: Found ${i.missingVariables.length} missing variables in ${i.affectedNodes.length} nodes`)}))}();break;case"scan-selection":yield function(){return e(this,void 0,void 0,(function*(){const e=figma.currentPage.selection;if(0!==e.length){figma.notify(`Scanning ${e.length} selected node(s) for missing gradient variables...`),d();for(const i of e)f(yield t(i));figma.ui.postMessage({type:"scan-complete",results:i}),figma.notify(`Scan complete: Found ${i.missingVariables.length} missing variables in ${i.affectedNodes.length} nodes`)}else figma.notify("No items selected. Please select nodes to scan.")}))}();break;case"scan-page":yield function(){return e(this,void 0,void 0,(function*(){figma.notify("Scanning current page for missing gradient variables..."),d(),f(yield t(figma.currentPage)),figma.ui.postMessage({type:"scan-complete",results:i}),figma.notify(`Scan complete: Found ${i.missingVariables.length} missing variables in ${i.affectedNodes.length} nodes`)}))}();break;case"get-variables":yield function(){return e(this,void 0,void 0,(function*(){const i=yield function(){return e(this,void 0,void 0,(function*(){const e=[];try{const i=figma.variables.getLocalVariableCollections();for(const t of i){const i=t.variableIds.map((e=>figma.variables.getVariableById(e))).filter(Boolean).filter((e=>"COLOR"===e.resolvedType));for(const n of i)e.push({id:n.id,name:n.name,key:n.key,resolvedType:n.resolvedType,collectionId:t.id,collectionName:t.name})}return e.sort(((e,i)=>e.collectionName===i.collectionName?e.name.localeCompare(i.name):e.collectionName.localeCompare(i.collectionName)))}catch(e){return console.error("Error getting color variables:",e),[]}}))}();figma.ui.postMessage({type:"variables-list",variables:i})}))}();break;case"rebind-variables":yield function(t){return e(this,void 0,void 0,(function*(){figma.notify("Relinking gradient variables...");try{const n=yield function(i,t){return e(this,void 0,void 0,(function*(){const e={successCount:0,failureCount:0,relinkedNodes:[]};for(const n of i)try{const i=figma.getNodeById(n.nodeId);if(!i){e.failureCount+=n.affectedStops.length;continue}const s=n.paintProperty;if(!(s in i)||!i[s]||i[s]===figma.mixed){e.failureCount+=n.affectedStops.length;continue}const o=i[s];if(!Array.isArray(o)||n.paintIndex>=o.length){e.failureCount+=n.affectedStops.length;continue}if(!a(o[n.paintIndex])){e.failureCount+=n.affectedStops.length;continue}for(const a of n.affectedStops){const n=t[a.missingVariableId||""];if(!n){e.failureCount++;continue}const o=figma.variables.getVariableById(n);o&&(yield l(i,s,a.paintIndex,a.stopIndex,o))?(e.successCount++,e.relinkedNodes.includes(i.id)||e.relinkedNodes.push(i.id)):e.failureCount++}}catch(i){console.error("Error relinking node:",n.nodeId,i),e.failureCount+=n.affectedStops.length}return e}))}(i.affectedNodes,t);figma.ui.postMessage({type:"rebind-complete",results:n}),figma.notify(`Successfully relinked ${n.successCount} gradient variables. Failed: ${n.failureCount}`)}catch(e){const i=e;figma.notify("Error while relinking variables: "+i.message),figma.ui.postMessage({type:"rebind-error",error:i.message})}}))}(n.variableMappings);break;case"cancel":figma.closePlugin()}}))}})[600]();