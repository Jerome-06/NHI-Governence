# 🐼 Pandas Mastery — Data Analysis with Python

![Python](https://img.shields.io/badge/Python-3.x-blue?style=flat&logo=python&logoColor=white)
![Pandas](https://img.shields.io/badge/Pandas-Data%20Analysis-150458?style=flat&logo=pandas&logoColor=white)
![Status](https://img.shields.io/badge/Status-In%20Progress-orange?style=flat)
![Role](https://img.shields.io/badge/Goal-Data%20Scientist%20%7C%20Analyst-green?style=flat)

> *"Data is the new oil — and pandas is how I refine it."*

---

## 👋 About Me

Hi, I'm **Jerome R** — an aspiring **Data Scientist / Analyst** passionate about turning raw data into meaningful insights.

This repository documents my hands-on journey learning **pandas**, one of the most powerful Python libraries for data analysis. Every script here was written, tested, and understood by me — not just copied.

---

## 🎯 Why This Project?

As a fresher stepping into the data world, I believe the best way to learn is by **writing real code**. This repo covers the complete pandas workflow — from loading data to cleaning it — the same workflow used by data professionals every day.

---

## 📚 What I Learned & Built

| # | Topic | What I Practiced | File |
|---|-------|-----------------|------|
| 1 | **Series** | Creating labeled 1D data, loc/iloc indexing, boolean filtering | `series.py` |
| 2 | **DataFrame** | Building tables, adding columns, filtering rows, concat | `dataframe.py` |
| 3 | **Importing Data** | Reading CSV & JSON files into DataFrames | `importing.py` |
| 4 | **Selection** | Selecting rows/columns by label, handling missing keys | `selection.py` |
| 5 | **Filtering** | Boolean masks, AND/OR conditions on real datasets | `filtering.py` |
| 6 | **Aggregation** | mean, sum, min, max, groupby — summarizing datasets | `aggregation.py` |
| 7 | **Data Cleaning** | Handling nulls, removing duplicates, fixing data types | `cleaning.py` |

---

## 💡 Key Concepts I Understand

- **`loc` vs `iloc`** — label-based vs position-based indexing
- **Boolean masking** — the core of pandas filtering
- **`groupby()`** — splitting data into groups for analysis
- **`pd.to_numeric(errors='coerce')`** — safely converting messy data
- **Data cleaning pipeline** — drop → fill → replace → standardize → deduplicate

---

## 🔍 Code Highlights

**Filtering students with score ≥ 75 AND age > 20:**
```python
result = df[(df["Score"] >= 75) & (df["Age"] > 20)]
```

**Grouping by department and finding average score:**
```python
group = df.groupby("Department")
print(group["Score"].mean())
```

**Full data cleaning pipeline:**
```python
df["Department"] = df["Department"].replace({"Mech": "Mechanical"})
df["Department"] = df["Department"].str.lower()
df["Score"] = pd.to_numeric(df["Score"], errors="coerce")
df = df.drop_duplicates()
```

---

## 📁 Project Structure

```
pandas-mastery/
│
├── series.py           # Pandas Series operations
├── dataframe.py        # DataFrame creation & manipulation
├── importing.py        # Reading CSV and JSON files
├── selection.py        # Row & column selection
├── filtering.py        # Boolean filtering techniques
├── aggregation.py      # Aggregation & groupby
├── cleaning.py         # Data cleaning pipeline
│
└── data/
    ├── data.csv        # Sample student dataset
    └── data.json       # Sample JSON dataset
```

---

## 🛠️ Tech Stack

- **Language:** Python 3.x
- **Library:** Pandas
- **Editor:** Visual Studio Code
- **Version Control:** Git & GitHub

---

## 🚀 Getting Started

```bash
# 1. Clone the repository
git clone https://github.com/JeromeR/pandas-mastery.git

# 2. Navigate into the folder
cd pandas-mastery

# 3. Install pandas
pip install pandas

# 4. Run any script
python cleaning.py
```

---

## 📈 My Data Science Roadmap

- [x] Python basics
- [x] Pandas fundamentals
- [ ] NumPy & data visualization (Matplotlib / Seaborn)
- [ ] Exploratory Data Analysis (EDA) on real datasets
- [ ] Machine Learning with Scikit-learn
- [ ] End-to-end data science project

---

## 🤝 Let's Connect

I'm actively looking for **Data Scientist / Analyst** opportunities.

- 📧 Email: your.email@gmail.com
- 💼 LinkedIn: [linkedin.com/in/jerome-r](https://linkedin.com/in/jerome-r)
- 🐙 GitHub: [github.com/JeromeR](https://github.com/JeromeR)

---

## 📄 License

This project is open source under the [MIT License](LICENSE).

---

<p align="center">
  <i>⭐ If this helped you learn pandas too, consider giving it a star!</i>
</p>
