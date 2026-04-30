from typing import List

def format_list_for_prompt(items: List[str]) -> str:
    return ", ".join(f'"{x}"' for x in sorted(set(items)))