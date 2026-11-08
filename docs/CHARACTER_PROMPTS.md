# Character art prompts

The active cast uses cartoon likenesses and real names of 12 Nigerian political figures, as requested. All dialogue, promises and reactions are invented game comedy, not real quotes, factual claims or endorsements.

## Sprite sheet layout

Generate each character separately with the built-in image generation tool. Use a transparent 1536 x 1024 PNG with three columns and two rows of equal square cells. Reading order: confident, startled, sweating, complaining, cartoon tears, overwhelmed. Each cell shows the same full-body character, centred with clear padding, in bold 2D mobile game art with thick dark-brown outlines and one soft shade. No labels, grid lines, party logos, injuries or weapons.

The frontend crops one cell at a time through the existing SVG component; a missing sheet falls back to layered SVG. Assets are saved in `frontend/public/characters/`. Exact generation prompts are saved beside them in `generation-prompts.json`.

## Current cast

| Name | File | Appearance prompt |
| --- | --- | --- |
| Bola Ahmed Tinubu | `bola-tinubu.png` | Older Yoruba man, round face, dark brown skin, round clear eyeglasses, patterned burgundy folded fila cap with cream infinity-like embroidery, cream agbada with green embroidery |
| Oluremi Tinubu | `oluremi-tinubu.png` | Nigerian woman with medium brown skin, rounded face, warm smile, neatly groomed brows, no glasses; elegant magenta ankara gown with gold zigzag trim, large sculptural gold gele headwrap, simple bead necklace, low-heeled shoes |
| Peter Obi | `peter-obi.png` | Nigerian man with medium dark brown skin, closely cropped black hair with receding hairline, clean shaven, distinctive dark rectangular eyeglasses, slim oval face; simple black short-sleeved traditional tunic and trousers, small silver buttons, black shoes, no cap |
| Atiku Abubakar | `atiku-abubakar.png` | Older Nigerian man with medium brown skin, broad rounded face, grey close-cropped beard and moustache, smiling eyes, no glasses; pale blue flowing agbada with navy embroidery, navy-and-cream embroidered northern cap, dark shoes |
| Goodluck Jonathan | `goodluck-jonathan.png` | Nigerian man with warm dark brown skin, broad oval face, characteristic black brimmed fedora hat, small neat moustache, no glasses; dark charcoal Niger Delta traditional long tunic with gold buttons and gold chain, matching trousers, black shoes |
| Muhammadu Buhari | `muhammadu-buhari.png` | Older Nigerian man with dark brown skin, lean elongated face, high cheekbones, thin grey moustache, clear narrow rectangular glasses; white flowing babban riga kaftan with pale grey embroidery, tall cream northern embroidered cap, brown shoes |
| Olusegun Obasanjo | `olusegun-obasanjo.png` | Older Nigerian man with deep brown skin, round broad face, mostly bald head with short grey side hair, broad nose, no facial hair, no glasses; rich blue Yoruba agbada with cream geometric embroidery, blue folded fila cap, brown shoes |
| Kashim Shettima | `kashim-shettima.png` | Nigerian man with medium brown skin, broad oval face, black moustache, receding hairline, thin rectangular clear eyeglasses; taupe-brown flowing kaftan with cream embroidery, patterned cream-and-brown northern cap, black shoes |
| Babatunde Fashola | `babatunde-fashola.png` | Nigerian man with medium dark brown skin, slim tall build, long narrow face, short grey-black hair, clean shaven, rectangular clear eyeglasses; navy blue traditional tunic and trousers with subtle pale blue embroidery, navy Yoruba fila cap, black shoes |
| Nyesom Wike | `nyesom-wike.png` | Nigerian man with dark brown skin, broad round stocky face, short black hair under a cream wide-brimmed hat, neat black moustache and small chin beard, no glasses; deep green Niger Delta traditional long tunic and trousers with gold buttons and a simple gold chain, black shoes |
| Oby Ezekwesili | `oby-ezekwesili.png` | Nigerian woman with medium brown skin, rounded oval face, distinctive dark rectangular eyeglasses, short natural black hair visible beneath a small red patterned headwrap; bright red and cream ankara blouse and long skirt with geometric zigzag pattern, simple necklace, low-heeled shoes |
| Godswill Akpabio | `godswill-akpabio.png` | Nigerian man with dark brown skin, broad round face, full cheeks, clean shaven, no glasses; white traditional long tunic and trousers with purple embroidery, round white cap with purple embroidered band, dark shoes |

## Name references

- [State House presidency](https://statehouse.gov.ng/presidency/)
- [State House past presidents](https://statehouse.gov.ng/past-heads-of-state-and-presidents/)
- [National Assembly: Godswill Akpabio](https://nass.gov.ng/mps/single/513)

Unlock costs and saved character IDs remain stable when names change. IDs are internal compatibility keys, not display names.
