import os

def insert_import(file_path):
    with open(file_path, 'r') as f:
        content = f.read()
    
    if "from typing import" not in content:
        # Just put it after import os or similar, or at the top
        content = "from typing import Any, Tuple, Optional, List, Dict, Union\n" + content
    else:
        # Replace the first from typing import line
        lines = content.split('\n')
        for i, line in enumerate(lines):
            if line.startswith("from typing import"):
                lines[i] = "from typing import Any, Tuple, Optional, List, Dict, Union, Callable"
                break
        content = '\n'.join(lines)
        
    with open(file_path, 'w') as f:
        f.write(content)

insert_import("backend/ml/sasrec.py")
insert_import("backend/ml/trope_graph.py")
insert_import("backend/retrieval/faiss_index.py")
