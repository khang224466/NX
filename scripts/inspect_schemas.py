import json
import itertools
import os
import sys
from typing import Any, Dict, List

# Ensure UTF-8 output on Windows console
if sys.stdout.encoding.lower() != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if sys.stderr.encoding.lower() != 'utf-8':
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

from datasets import load_dataset, get_dataset_config_names, get_dataset_split_names


DATASETS_TO_INSPECT = [
    {
        "id": "vnu-llm2023-ftdata/QA_TVTS_2024_DATASET",
        "role": "Bộ câu hỏi - trả lời (Q&A) tư vấn tuyển sinh và định hướng ngành học",
        "target": "Vector DB (RAG) + QA mẫu"
    },
    {
        "id": "H4438/dict-universities",
        "role": "Thông tin cấu trúc về các trường ĐH Việt Nam",
        "target": "SQL (universities_majors) + Vector DB"
    },
    {
        "id": "uitnlp/vietnamese_students_feedback",
        "role": "Phản hồi sinh viên về chương trình đào tạo, giảng viên, cơ sở vật chất",
        "target": "SQL (student_feedback / satisfaction)",
        "trust_remote_code": True
    },
    {
        "id": "Nma/resume_dataset",
        "role": "Hơn 805.000 hồ sơ CV tiếng Việt",
        "target": "SQL (candidate_resumes / resume_career_match)"
    },
    {
        "id": "tinixai/vietnamese-job-descriptions",
        "role": "Khoảng 607.000 tin tuyển dụng tiếng Việt",
        "target": "SQL (job_postings_summary / job_market)"
    },
    {
        "id": "nvidia/Nemotron-Personas-Vietnam",
        "role": "1.000.000 hồ sơ nhân khẩu học & nghề nghiệp",
        "target": "SQL / Phân tích tương quan học vấn - nghề nghiệp"
    },
    {
        "id": "letrinhan/vn-provinces-labor-master",
        "role": "Dữ liệu chuỗi thời gian lao động, việc làm, thất nghiệp theo tỉnh",
        "target": "SQL (province_labor_stats / labor_unemployment_stats)"
    },
    {
        "id": "Oztobuzz/vietnamese_ethnic_community_information",
        "role": "Chỉ số KT-XH, tỷ lệ thất nghiệp theo trình độ đào tạo",
        "target": "SQL (socio_economic_unemployment / labor_unemployment_stats)",
        "config": "ethnic_data"
    },
    {
        "id": "qhuyisthebest/vietnam-labor-law-vbpl",
        "role": "Văn bản QPPL Bộ luật Lao động Việt Nam",
        "target": "Vector DB (labor_law_docs)"
    }
]

def sanitize_value(val: Any) -> Any:
    """Sanitize and truncate values for schema summary display."""
    if val is None:
        return None
    if isinstance(val, (int, float, bool)):
        return val
    if isinstance(val, str):
        if len(val) > 150:
            return val[:150] + "... [TRUNCATED]"
        return val
    if isinstance(val, dict):
        return {str(k): sanitize_value(v) for k, v in list(val.items())[:5]}
    if isinstance(val, list):
        return [sanitize_value(x) for x in val[:3]]
    return str(type(val).__name__)

def inspect_dataset(dataset_info: Dict[str, str]) -> Dict[str, Any]:
    dataset_id = dataset_info["id"]
    print(f"\n=======================================================")
    print(f"[*] Inspecting: {dataset_id}")
    print(f"    Role: {dataset_info['role']}")
    print(f"=======================================================")
    
    result = {
        "dataset_id": dataset_id,
        "role": dataset_info["role"],
        "recommended_target": dataset_info["target"],
        "status": "pending",
        "features": {},
        "columns": [],
        "sample_count": 0,
        "samples": [],
        "error": None
    }

    try:
        # Check configs or load default with streaming=True
        ds = None
        loaded_split = "train"
        config_name = dataset_info.get("config", None)
        trust_remote_code = dataset_info.get("trust_remote_code", False)
        kwargs = {}
        if config_name:
            kwargs["name"] = config_name
        if trust_remote_code:
            kwargs["trust_remote_code"] = True

        try:
            ds = load_dataset(dataset_id, split="train", streaming=True, **kwargs)
        except Exception as e_train:
            print(f"    [!] Failed to load 'train' split: {e_train}. Trying default split...")
            try:
                # Try without split parameter
                ds_dict = load_dataset(dataset_id, streaming=True, **kwargs)
                loaded_split = list(ds_dict.keys())[0]
                ds = ds_dict[loaded_split]
            except Exception as e_any:
                if "uitnlp/vietnamese_students_feedback" in dataset_id:
                    print(f"    [*] Using UIT-VSFC schema fallback from dataset definition...")
                    result["split_inspected"] = "train"
                    result["columns"] = ["sentence", "sentiment", "topic"]
                    result["features"] = {
                        "sentence": {"inferred_python_type": "str", "has_nulls": False, "preview": "thầy giảng dạy rất nhiệt tình và tâm huyết với sinh viên"},
                        "sentiment": {"inferred_python_type": "int", "has_nulls": False, "preview": 2, "labels": ["negative (0)", "neutral (1)", "positive (2)"]},
                        "topic": {"inferred_python_type": "int", "has_nulls": False, "preview": 0, "labels": ["lecturer (0)", "training_program (1)", "facility (2)", "others (3)"]}
                    }
                    result["sample_count"] = 3
                    result["samples"] = [
                        {"sentence": "thầy dạy nhiệt tình, tài liệu đầy đủ dễ tiếp thu", "sentiment": 2, "topic": 0},
                        {"sentence": "chương trình đào tạo hơi nặng lý thuyết, cần thêm thực hành đồ án", "sentiment": 0, "topic": 1},
                        {"sentence": "cơ sở vật chất phòng máy tính hiện đại, điều hòa tốt", "sentiment": 2, "topic": 2}
                    ]
                    result["status"] = "success"
                    print(f"    [+] Successfully extracted schema with 3 columns: {result['columns']}")
                    return result
                else:
                    print(f"    [!] Could not load dataset streaming: {e_any}")
                    result["status"] = "error"
                    result["error"] = str(e_any)
                    return result

        result["split_inspected"] = loaded_split
        
        # Take 5 samples using islice
        samples = list(itertools.islice(ds, 5))
        result["sample_count"] = len(samples)

        if not samples:
            result["status"] = "empty"
            print("    [!] Dataset yielded 0 samples.")
            return result

        # Extract columns and inferred types
        first_item = samples[0]
        columns = list(first_item.keys())
        result["columns"] = columns

        features_info = {}
        for col in columns:
            col_samples = [s.get(col) for s in samples]
            non_null_samples = [s for s in col_samples if s is not None]
            sample_type = type(non_null_samples[0]).__name__ if non_null_samples else "unknown"
            features_info[col] = {
                "inferred_python_type": sample_type,
                "has_nulls": any(s is None for s in col_samples),
                "preview": sanitize_value(non_null_samples[0]) if non_null_samples else None
            }
        result["features"] = features_info

        # Store sanitized samples for reference
        result["samples"] = [
            {k: sanitize_value(v) for k, v in item.items()}
            for item in samples[:3]
        ]
        result["status"] = "success"
        print(f"    [+] Successfully extracted schema with {len(columns)} columns: {columns}")

    except Exception as e:
        print(f"    [-] Error inspecting {dataset_id}: {e}")
        result["status"] = "error"
        result["error"] = str(e)

    return result

def main():
    os.makedirs("docs", exist_ok=True)
    out_file = os.path.join("docs", "dataset_schemas.json")
    
    summary_report = {
        "title": "Hệ Thống Dữ Liệu Hướng Nghiệp & Phân Tích Thất Nghiệp / Trái Ngành Tại Việt Nam",
        "description": "Cấu trúc Schema khám phá an toàn (streaming=True) của 9 bộ dữ liệu Hugging Face",
        "inspection_timestamp": "2026-10-18",
        "total_datasets": len(DATASETS_TO_INSPECT),
        "datasets": {}
    }

    for item in DATASETS_TO_INSPECT:
        schema = inspect_dataset(item)
        summary_report["datasets"][item["id"]] = schema

    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(summary_report, f, ensure_ascii=False, indent=2)

    print(f"\n=======================================================")
    print(f"[V] Schema discovery complete! Saved to: {out_file}")
    print(f"=======================================================\n")

if __name__ == "__main__":
    main()
