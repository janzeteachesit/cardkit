'use strict';

/**
 * @ngdoc directive
 * @name cardkitApp.directive:snapSvg
 * @description
 * # snapSvg
 */
angular.module('cardkitApp')
  .directive('snapSvg', function (snapSVG) {
    return {
      template: '<svg id="snap-svg"></svg>',
      restrict: 'E',
      scope: {
        svgConfig: '=',
        svgTheme: '='
      },
      link: function postLink(scope, element) {
        // Check for functions in the config, and resolve them
        function functionise(element) {
          var attrs = {};
          for(var item in element) {
            switch(typeof element[item]) {
              case 'function':
                attrs[item] = element[item]();
                break;
              default:
                attrs[item] = element[item];
                break;
            }
          }

          return attrs;
        }

      	// Destringify the JSON object
        var data = angular.fromJson(scope.svgConfig);

      	// Setup element
      	var s = snapSVG(element[0].children[0]);

      	// Setup canvas background
        var canvasData = functionise(data.canvas);
      	var background = s.rect(0, 0, canvasData.width, canvasData.height, 0, 0).attr(canvasData);
      	if(canvasData.draggable === true) {
      		background.drag();
      	}

      	// Setup some element variables
      	var elements = [],
      		  el;

      	// The function that sets up the element with the required settings
      	function setupElement(element) {
      		var el;
          element = functionise(element);

      		switch(element.type) {
      			case 'text':
					    el = s.text(element.x, element.y);
      				break;
      			case 'image':
      				el = s.image(element.src, element.x, element.y, element.width, element.height);
      				break;
      			case 'rect':
      				el = s.rect(element.x, element.y, element.width, element.height, 0, 0);
      				break;
      			case 'circle':
      				break;
      			case 'group':
      				var gEl;
      				el = '';
      				angular.forEach(element.elements, function(e, k) {
      					gEl = setupElement(e);
                setAttributes(gEl, e);
      				
        			  if(k === 0) {
      						el = s.group(gEl);
    						} else {
      						el.group(gEl);
      					}
      				});
      				break;
      			default: 
      				return false;
      		}

      		return el;
      	}

        // Setup our atrribtes on the specific element
        function setAttributes(el, element) {
          var attrs = functionise(element);
          var elementData = attrs;
          delete elementData.$$hashKey;
          el.attr(elementData);
          return el;
        }

      	// Draw the elements on the SVG
      	function drawElements() {
          // Make changes to the canvas
          setAttributes(background, scope.svgConfig.canvas);

          // Loop through all elements
	      	angular.forEach(scope.svgConfig.elements, function(element, key) {
          	// Check if we have setup the element already
	      		if(typeof elements[key] !== 'undefined') {
	      			// The element already exists
	      			el = elements[key];

              // If the type is image
              if(el.type === 'image') {
                // Store matrix transformation, we'll need it later to prevent the image moving around the SVG when replaced 
                var matrix = el.matrix;

                // Destroy and recreate
                el.remove();
                
                // Create new element based on config
                el = setupElement(scope.svgConfig.elements[key]);

                if(el === false) {
                  return;
                }

                // Apply matrix transformation from previous element
                el.transform(matrix);

                // Add the created element to a list of elements
                elements[key] = el;
              }

              if(el.type === 'g') {
                // Destroy and recreate
                el.remove();
                
                // Create new element based on config
                el = setupElement(scope.svgConfig.elements[key]);

                if(el === false) {
                  return;
                }

                // Add the created element to a list of elements
                elements[key] = el;
              }
	      		} else {
              // Create new element based on config
      			  el = setupElement(element);

	      			if(el === false) {
	      				return;
	      			}

	      			// Add the created element to a list of elements
	      			elements.push(el);
	      		}

	      		// Update the attributes (e.g. text and colours) based on config data
	      		var elementData = element;
	      		delete elementData.$$hashKey;

	      		// Update the element!
            setAttributes(el, element);

    				// Check if we're to enable dragging
    				if(element.draggable === true) {
    					// We have to 'undrag' the element here, because they can get choppy after a few redraws otherwise
    					el.undrag();

    					// Drag dat
    					el.drag();
    				}
    			});
      	}

      	// Watch for changes on the scope and the theme, and redraw
        scope.$watch('svgConfig', drawElements, true);
        scope.$on('changeTheme', drawElements);
      }
    };
  });
