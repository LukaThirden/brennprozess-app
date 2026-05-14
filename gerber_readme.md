# Gerber Files for Gate Trigger PCB

These are simplified Gerber files for manufacturing the PCB described in `pcb_layout.md`.

## Files Included
- `circuit.GTL`: Top Copper Layer
- `circuit.GTS`: Top Solder Mask
- `circuit.GTO`: Top Silkscreen
- `circuit.TXT`: Drill File

## Usage
- Zip these files together (e.g., as circuit.zip).
- Send to a PCB manufacturer like JLCPCB or PCBWay.
- Specify: 1-layer board, FR4, 1.6mm thickness, green solder mask, white silkscreen.

## Notes
- These are basic approximations; for accurate Gerbers, use KiCad or Eagle to export from the layout.
- Coordinates are in mm (scaled for Gerber).
- Test with Gerber viewer software before ordering.

## Diagram
```mermaid
graph TD
    A[Gerber Files] --> B[Top Copper .GTL]
    A --> C[Top Solder Mask .GTS]
    A --> D[Top Silkscreen .GTO]
    A --> E[Drill .TXT]
    B --> F[PCB Manufacturing]
```</content>
<parameter name="filePath">/Users/daniel.kurth@fhnw.ch/Privat/websit_AI/gerber_readme.md