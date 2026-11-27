# 3D models (the "kit" look)

All three packs are by Kenney (kenney.nl) and released under **CC0 1.0** (public domain): free for commercial
use, no credit required. See `buildings/License.txt` and `nature/License.txt`.

- `buildings/pieces.gltf` (+ `.bin`, `Textures/colormap.png`): 14 pieces from **Modular Buildings** (v2.1),
  merged into one file. The campus recolours the palette at runtime (`src/scene/kit.jsx`).
- `people/character-*.gltf` (+ `.bin`, `Textures/colormap.png`): the 12 characters from **Mini Characters**
  (v1.0). Only `character-male-a` keeps animations, the ten the campus and stadium use (idle, walk, sprint,
  sit, emote-yes, jump, fall, crouch, attack-kick-right, interact-right); all twelve share its bones. Vertex
  data is quantized (KHR_mesh_quantization).
- `nature/nature.gltf` (+ `.bin`): three trees (tree_default, tree_oak, tree_fat) from **Nature Kit** (v2.1),
  merged into one file.

Why `.gltf` + `.bin` and not `.glb`: the textures must stay separate files. The live site's Content Security
Policy allows images only from the same origin (and `data:`), and a texture embedded in a GLB loads through a
`blob:` URL. No Draco or Meshopt either: their decoders need WebAssembly, which the CSP doesn't allow.

How these were made (scripts kept outside the repo): download the packs, then with gltf-transform 4.1, remove
unused animations (channels and samplers too), prune, dedup and quantize the people, and merge the building
pieces into one document.
