# Biological cinema asset workflow

Orr Biologicals currently ships an honest, local procedural 3D fallback rather
than pretending that a Blender or CAD integration was available. Blender,
FreeCAD, and OpenSCAD were not installed in the build environment, and no
authorized image-generation webhook was configured.

The editable source for the shipped scenes is therefore code, not a flattened
render:

- `js/biological-cinema.mjs` — Three.js source for the Volvox field, homepage
  photobioreactor, Algaephyte cultivation apparatus, and Cyanoflow chip.
- `Simulation/js/simulation-renderer.js` — the Digital Lab's interactive
  vessel renderer and Canvas fallback.
- `js/cyano-app.js` — the Cyanoflow educational chip-flow simulation.
- `tools/build_cinema.mjs` and `tools/build_simulation.mjs` — deterministic
  local bundle steps using the installed Three.js dependency.

The scenes use procedural geometry, seeded placement, self-hosted materials,
and explicit labels such as “illustrative”, “synthetic”, and “research concept”.
They are not microscope observations, fabricated instrument telemetry, or
evidence that the proposed hardware has been built or validated.

## Asset inventory

| Scene | Browser route | Source | Rendering path |
| --- | --- | --- | --- |
| Volvox-inspired fluorescence field | `/` | `makeVolvoxScene` | Three.js WebGL, static frame under reduced motion |
| Hero photobioreactor | `/` | `makeReactorScene` | Three.js WebGL, scroll-linked camera |
| Cultivation apparatus | `/algaephyte/` | `makeCultivationScene` | Three.js WebGL, drag/orbit inspection |
| Microfluidic cartridge | `/cyanoflow` | `makeChipScene` | Three.js WebGL, drag/orbit inspection |
| Digital Lab vessel | `/Simulation/` | `SimulationRenderer` | Three.js WebGL with Canvas fallback |

The JPG/WebP files under `assets/` remain supporting editorial illustrations.
They are not presented as the primary 3D implementation. If a future session
adds Blender or CAD, exported GLB/glTF files can replace these procedural
constructors behind the same page-level scene interfaces.
