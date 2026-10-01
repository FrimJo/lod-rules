# Treasure source matrices

`source-tables.json` preserves the PDF text extractor's cell matrices for physical pages
193–196, 199–202 and 213 of `source/Rulebook-2nd-printing-ENGa.pdf`. All these tables were
checked against page renders. Empty strings, null continuation cells and artificial column
splits remain here so tests can reconstruct the printed cells independently of canonical
YAML serialization. These are regression fixtures from a source audit, not an independent
review claim. They are not compiler output and do not replace the authoritative PDF.

Tests check every original furniture/name/description/effect cell, all selector blanks,
and reconstructed nested roll endpoints. PDF 197–198 reuse the alchemy matrix tests.
