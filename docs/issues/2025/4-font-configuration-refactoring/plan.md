# Font Configuration Refactoring

## Overview
Refactor the three-js-layouter library to allow font configuration by library users instead of having hardcoded font paths in the library implementation.

## Current Situation
- Font path is hardcoded in `/projects/planner/frontend/libs/three-js-layouter/src/group-factory/load-font.ts:12` as `'./fonts/PlemolJP_Regular.json'`
- Library users cannot specify their own fonts without modifying the library source code
- Font loading is handled entirely within the library with no external configuration options

## Problem Statement
- Library flexibility is limited due to hardcoded font configuration
- Users who want to use different fonts must modify library source code
- Font path assumptions make the library tightly coupled to specific project structures
- No way to configure fonts at runtime or through configuration files

## Requirements
- Enable library users to specify relative font paths through configuration
- Support only relative font paths (no absolute paths needed)
- Provide clear API for font configuration
- Ensure proper error handling for invalid font paths
- Make font path configuration mandatory (no default fallback)

## Implementation Plan

### API Design
- Add required font path parameter to group factory functions
- Create font configuration interface/type for type safety
- Support relative URL strings only
- Remove hardcoded font path entirely

### Library Changes
- Modify `loadFont` function to require font path parameter
- Remove hardcoded font path and make configuration required
- Add validation for relative font path format
- GroupFactoryContext remains unchanged (already accepts Font objects)

### Example Application Updates
- Update three-js-layouter-example to pass font path configuration
- Update all existing usage to explicitly specify font paths
- Add examples showing different relative font path configurations

### Error Handling
- Add proper error messages for invalid relative font paths
- Provide clear debugging information for font-related issues
- Add validation for relative path format and supported font formats
- Fail fast when font path configuration is missing

### Documentation
- Add JSDoc comments to modified functions explaining font path parameter
- Update code examples in three-js-layouter-example
- Document relative path requirements and limitations in code comments

## Timeline Estimate
- API design and interface definition: 1 point
- Core library refactoring: 2 points
- Example application updates: 2 points
- Error handling implementation: 1 point
- Documentation and testing: 2 points
- **Total: 8 points**

## Success Criteria
- Library users must specify relative font paths through configuration
- Clear error messages are provided for invalid or missing font paths
- API is well-documented with practical examples
- All usage examples demonstrate the new required font path parameter
- Font path validation works correctly for relative paths

## Risks and Considerations
- Font file path resolution limited to relative paths only
- Potential issues with relative path resolution in different build systems
- Need to ensure consistent relative path behavior across development and production builds

## Post-Implementation
- Monitor for user feedback on new font configuration API
- Consider additional font-related features based on usage patterns
- Evaluate need for font caching or preloading mechanisms
- Plan for potential font format support expansion