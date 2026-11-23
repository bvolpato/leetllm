#!/usr/bin/env python3
"""
Migrate Mermaid diagrams from inline `style` directives to `:::className` syntax.

Maps known fill colors to semantic class names:
  #7c3aed → :::primary   (purple)
  #2563eb → :::secondary  (blue)
  #059669 → :::success    (green)
  #d97706 → :::warning    (amber)
  #dc2626 → :::danger     (red)
  #1e293b → :::muted      (slate gray)

Usage:
  python3 migrate_styles.py           # Dry run (preview changes)
  python3 migrate_styles.py --apply   # Apply changes to files
"""

import re
import os
import sys

CONTENT_DIR = os.path.join(os.path.dirname(__file__), '..', '..', 'src', 'content')

# Map fill colors to class names
FILL_TO_CLASS = {
    '#7c3aed': 'primary',
    '#2563eb': 'secondary',
    '#059669': 'success',
    '#d97706': 'warning',
    '#dc2626': 'danger',
    '#06b6d4': 'accent',
    '#1e293b': 'muted',
    '#1a1b26': 'muted',   # darker variant → normalize to muted
    '#0f172a': 'muted',   # darker variant → normalize to muted
    '#94a3b8': 'muted',   # light gray → normalize to muted
    '#991b1b': 'danger',  # darker red → normalize to danger
}

# Also match some stroke-first patterns (some diagrams use stroke before fill)
STROKE_TO_FILL = {
    '#6d28d9': '#7c3aed',
    '#1d4ed8': '#2563eb',
    '#047857': '#059669',
    '#b45309': '#d97706',
    '#b91c1c': '#dc2626',
    '#334155': '#1e293b',
}

MERMAID_RE = re.compile(r'```mermaid\n(.*?)```', re.DOTALL)

# Match style lines like: style A fill:#7c3aed,color:#fff,stroke:#6d28d9
# or: style A fill:#7c3aed,stroke:#6d28d9,color:#fff  (any order)
STYLE_LINE_RE = re.compile(
    r'^(\s*)style\s+(\S+)\s+(.+)$'
)

def extract_fill_from_style(style_props: str) -> str | None:
    """Extract fill color from style properties string."""
    match = re.search(r'fill:(#[0-9a-fA-F]{6})', style_props)
    if match:
        return match.group(1).lower()
    return None


def add_class_to_node(block: str, node_id: str, class_name: str) -> str:
    """Add :::className to a node definition in the block."""
    lines = block.split('\n')
    result = []
    found = False

    for line in lines:
        if found or f':::' in line and node_id in line:
            # Already has a class or already processed
            result.append(line)
            continue

        # Look for the node definition - various patterns:
        # A["text"] or A[text] or A{text} or A(text) or A{"text"} etc.
        # Also handles: A --> B["text"], where we need to find node B specifically
        
        # Pattern: node_id followed by a bracket/brace/paren
        # We need to be careful to match the exact node ID, not a substring
        # e.g. node "A" should not match "AB"
        
        # Check if this line defines the node (has brackets after the ID)
        # Patterns: NodeID["..."], NodeID[...], NodeID{...}, NodeID(...), NodeID(("..."))
        patterns = [
            # Direct definition: A["text"]
            (rf'(\b{re.escape(node_id)})(\["[^"]*"\])', r'\1\2:::' + class_name),
            (rf'(\b{re.escape(node_id)})(\[[^\]]*\])', r'\1\2:::' + class_name),
            # Decision node: A{"text"}
            (rf'(\b{re.escape(node_id)})({{[^}}]*}})', r'\1\2:::' + class_name),
            # Round: A("text")
            (rf'(\b{re.escape(node_id)})(\([^)]*\))', r'\1\2:::' + class_name),
            # Double round: A(("text"))
            (rf'(\b{re.escape(node_id)})(\(\([^)]*\)\))', r'\1\2:::' + class_name),
        ]

        new_line = line
        for pattern, replacement in patterns:
            new_line_candidate = re.sub(pattern, replacement, line)
            if new_line_candidate != line:
                new_line = new_line_candidate
                found = True
                break

        result.append(new_line)

    return '\n'.join(result)


def migrate_block(block: str) -> tuple[str, list[str]]:
    """
    Migrate a single mermaid block from style directives to :::className.
    Returns (new_block, list_of_changes).
    """
    lines = block.split('\n')
    changes = []
    
    # First pass: identify which style lines can be migrated
    style_migrations = []  # (line_index, node_id, class_name)
    
    for i, line in enumerate(lines):
        match = STYLE_LINE_RE.match(line)
        if not match:
            continue
        
        indent = match.group(1)
        node_id = match.group(2)
        props = match.group(3)
        
        fill_color = extract_fill_from_style(props)
        if fill_color and fill_color in FILL_TO_CLASS:
            class_name = FILL_TO_CLASS[fill_color]
            style_migrations.append((i, node_id, class_name))
    
    if not style_migrations:
        return block, []
    
    # Second pass: add :::className to node definitions
    new_block = block
    for _, node_id, class_name in style_migrations:
        new_block = add_class_to_node(new_block, node_id, class_name)
        changes.append(f"  {node_id} → :::{class_name}")
    
    # Third pass: remove migrated style lines
    new_lines = new_block.split('\n')
    migrated_node_ids = {node_id for _, node_id, _ in style_migrations}
    
    filtered_lines = []
    for line in new_lines:
        match = STYLE_LINE_RE.match(line)
        if match and match.group(2) in migrated_node_ids:
            # Check this style line's fill is one we migrated
            fill = extract_fill_from_style(match.group(3))
            if fill and fill in FILL_TO_CLASS:
                continue  # Remove this style line
        filtered_lines.append(line)
    
    # Clean up trailing blank lines before closing ```
    while len(filtered_lines) > 1 and filtered_lines[-1].strip() == '' and filtered_lines[-2].strip() == '':
        filtered_lines.pop(-1)
    
    return '\n'.join(filtered_lines), changes


def process_file(filepath: str, apply: bool) -> int:
    """Process a single file. Returns number of diagrams migrated."""
    with open(filepath, 'r') as f:
        content = f.read()
    
    if '```mermaid' not in content:
        return 0
    
    total_changes = 0
    new_content = content
    rel_path = os.path.relpath(filepath, CONTENT_DIR)
    
    # Find all mermaid blocks and process them
    blocks = list(MERMAID_RE.finditer(content))
    
    # Process in reverse order to preserve positions
    for match in reversed(blocks):
        block = match.group(1)
        
        # Skip blocks that already use only ::: syntax (no style lines)
        if 'style ' not in block:
            continue
        
        new_block, changes = migrate_block(block)
        
        if changes:
            total_changes += 1
            if not apply:
                print(f"  📊 {rel_path} (diagram)")
                for c in changes:
                    print(f"    {c}")
            
            # Replace in content
            new_content = (
                new_content[:match.start(1)] +
                new_block +
                new_content[match.end(1):]
            )
    
    if total_changes > 0 and apply:
        with open(filepath, 'w') as f:
            f.write(new_content)
        print(f"  ✓ {rel_path} — {total_changes} diagram(s) migrated")
    
    return total_changes


def main():
    apply = '--apply' in sys.argv
    
    if apply:
        print("\n🔄 Migrating Mermaid style directives to :::className syntax\n")
    else:
        print("\n👀 DRY RUN — Preview of style → :::className migrations")
        print("   Run with --apply to write changes\n")
    
    total_files = 0
    total_diagrams = 0
    
    for root, dirs, files in sorted(os.walk(CONTENT_DIR)):
        for f in sorted(files):
            if f != 'content.md':
                continue
            filepath = os.path.join(root, f)
            count = process_file(filepath, apply)
            if count > 0:
                total_files += 1
                total_diagrams += count
    
    print(f"\n{'✅ Applied' if apply else '📋 Would migrate'}: "
          f"{total_diagrams} diagram(s) across {total_files} file(s)\n")


if __name__ == '__main__':
    main()
