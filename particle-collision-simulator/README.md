# Particle Collision Monte Carlo Simulator

A production-quality Monte Carlo simulator for simplified high-energy particle collisions, built with Python and scientific computing libraries. Generates large collision-event datasets, produces publication-quality visualisations, and performs statistical analyses — similar to tools used in CERN-style computational particle physics research.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Physics Background](#physics-background)
3. [How Monte Carlo Works](#how-monte-carlo-works)
4. [Project Structure](#project-structure)
5. [Getting Started](#getting-started)
6. [Usage](#usage)
7. [Example Output](#example-output)
8. [Technology Stack](#technology-stack)
9. [Roadmap / TODOs](#roadmap--todos)
10. [License](#license)

---

## Project Overview

This simulator models a **2→2 particle scattering** process: two beam particles collide and produce two final-state particles. The initial beam energies and collision angle are drawn randomly (Monte Carlo sampling), and the kinematics of the outgoing particles are computed analytically in the centre-of-mass frame using conservation of four-momentum.

The pipeline:

```
Random Sampling  →  Kinematics  →  Dataset  →  Plots + Analysis
   (MC engine)      (physics)     (Pandas)     (Matplotlib / SciPy)
```

**Key features:**

- Generate **100 000+** collision events in seconds (fully vectorised with NumPy).
- Export datasets as **CSV** and **NumPy** binary files.
- Produce six publication-quality plots (energy distributions, angular distributions, momentum scatter, density maps, invariant mass spectrum).
- Run automated **statistical analysis** with distribution fitting (Gaussian, log-normal, exponential) and Kolmogorov–Smirnov goodness-of-fit tests.
- Clean CLI with configurable parameters.

---

## Physics Background

### Energy–Momentum Relation

In special relativity a particle of rest mass *m* and 3-momentum **p** has total energy:

```
E² = |p|²c² + m²c⁴
```

In **natural units** (ℏ = c = 1) this simplifies to `E² = p² + m²`.

### Centre-of-Mass Frame

For a collision of particles A and B the **invariant mass** (or CM energy) is:

```
√s = √[(E_A + E_B)² − |p_A + p_B|²]
```

This is the total energy available to create new particles. In the CM frame the total 3-momentum is zero, so the two outgoing particles share √s according to:

```
E₁* = (s + m₁² − m₂²) / (2√s)
E₂* = √s − E₁*
```

When the final-state particles are massless (e.g. photons) each simply gets √s / 2.

### Simplified Model

This simulator uses a **simplified but physically motivated** model:

1. Beam energies are drawn uniformly from a configurable range.
2. Collision angles follow an isotropic distribution (uniform in cos θ).
3. Momentum vectors are computed from spherical-to-Cartesian decomposition.
4. Final-state energies are derived from four-momentum conservation with a small stochastic asymmetry.

---

## How Monte Carlo Works

**Monte Carlo methods** estimate deterministic quantities through repeated random sampling. In particle physics they are used to:

| Application | Description |
|---|---|
| **Event generation** | Produce pseudo-data mimicking detector output |
| **Phase-space integration** | Evaluate high-dimensional integrals numerically |
| **Uncertainty propagation** | Sample nuisance parameters to estimate systematic errors |

### Algorithm (this simulator)

```
for each event i = 1 … N:
    E_A  ~ Uniform(E_min, E_max)
    E_B  ~ Uniform(E_min, E_max)
    θ    ~ Isotropic (uniform in cos θ)
    φ    ~ Uniform(0, 2π)

    compute |p_A|, |p_B|  from E² = p² + m²
    compute (px, py, pz)  via spherical → Cartesian
    compute √s            (invariant mass)
    compute E₁*, E₂*      (final-state energies)
```

The full simulation is **vectorised** — all *N* events are computed simultaneously with NumPy array operations, avoiding Python-level loops entirely.

---

## Project Structure

```
particle-collision-simulator/
│
├── src/
│   ├── main.py            # CLI entry point
│   ├── config.py           # Simulation parameters & physical constants
│   ├── simulation.py       # High-level orchestrator
│   ├── physics.py          # Relativistic kinematics
│   ├── montecarlo.py       # Monte Carlo sampling engine
│   ├── dataset.py          # CSV / NumPy persistence
│   ├── visualization.py    # Matplotlib plot suite
│   └── analysis.py         # Statistical analysis & reporting
│
├── data/
│   ├── raw/                # Generated datasets
│   └── processed/          # (reserved for downstream analysis)
│
├── results/
│   ├── plots/              # PNG + PDF figures
│   └── logs/               # Analysis reports
│
├── requirements.txt
├── setup.sh                # One-command environment setup
└── README.md               # ← you are here
```

---

## Getting Started

### Prerequisites

- **Python 3.11+**
- `pip` (comes with Python)

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd particle-collision-simulator

# Run the setup script (creates venv + installs deps)
chmod +x setup.sh
./setup.sh

# Activate the virtual environment
source venv/bin/activate
```

Or manually:

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

---

## Usage

### Basic run (100 000 events, full pipeline)

```bash
python src/main.py
```

### Custom event count

```bash
python src/main.py --events 50000
```

### Specify energy range

```bash
python src/main.py --events 200000 --energy-min 10 --energy-max 500
```

### Skip plots (data + analysis only)

```bash
python src/main.py --events 100000 --no-plot
```

### Skip dataset export

```bash
python src/main.py --events 100000 --no-save-dataset
```

### Full option list

```bash
python src/main.py --help
```

| Flag | Default | Description |
|---|---|---|
| `--events`, `-n` | 100 000 | Number of collision events |
| `--energy-min` | 1.0 | Minimum beam energy (GeV) |
| `--energy-max` | 1000.0 | Maximum beam energy (GeV) |
| `--seed` | 42 | Random seed (−1 = non-deterministic) |
| `--save-dataset` | True | Export CSV + NPZ to `data/raw/` |
| `--no-save-dataset` | — | Disable dataset export |
| `--plot` | True | Generate plots in `results/plots/` |
| `--no-plot` | — | Disable plot generation |
| `--output-dir`, `-o` | auto | Project root directory |

---

## Example Output

### Console output (excerpt)

```
╔══════════════════════════════════════════════════════╗
║   Particle Collision Monte Carlo Simulator           ║
╚══════════════════════════════════════════════════════╝

╔══════════════════════════════════════════╗
║        Simulation Configuration          ║
╚══════════════════════════════════════════╝
  Events         :       50,000
  Energy range   : [1.0, 1000.0] GeV
  Angle range    : [0.000, 3.142] rad

  ⚙  MonteCarloEngine  seed=42  events=50,000
  → Sampling event parameters …
    ✔ Sampling complete  (0.01 s)
  → Computing kinematics …
    ✔ Kinematics complete  (0.03 s)
    ✔ 50,000 events generated in 0.04 s (1,250,000 events/s)

  💾  CSV saved  → data/raw/collision_events.csv.gz  (2.14 MB)
  💾  NPZ saved  → data/raw/collision_events.npz     (1.87 MB)

  📊  Plot saved → energy_distribution.png
  📊  Plot saved → angular_distribution.png
  📊  Plot saved → momentum_scatter.png
  📊  Plot saved → event_density.png
  📊  Plot saved → final_energy_correlation.png
  📊  Plot saved → invariant_mass.png
```

### Generated plots

| Plot | Description |
|---|---|
| `energy_distribution.png` | Overlaid beam + final-state energy histograms |
| `angular_distribution.png` | θ and cos θ distributions (isotropy check) |
| `momentum_scatter.png` | px–py and px–pz scatter plots |
| `event_density.png` | 2-D heat map of (E_A, E_B) |
| `final_energy_correlation.png` | Anti-correlation from energy conservation |
| `invariant_mass.png` | Reconstructed √s spectrum |

### Dataset columns

| Column | Unit | Description |
|---|---|---|
| `event_id` | — | Sequential event identifier |
| `particle_A_energy` | GeV | Beam energy of particle A |
| `particle_B_energy` | GeV | Beam energy of particle B |
| `collision_angle` | rad | Polar scattering angle θ |
| `momentum_x` | GeV/c | Total system px |
| `momentum_y` | GeV/c | Total system py |
| `momentum_z` | GeV/c | Total system pz |
| `final_energy_1` | GeV | Outgoing particle 1 energy |
| `final_energy_2` | GeV | Outgoing particle 2 energy |

---

## Technology Stack

| Library | Role |
|---|---|
| **NumPy** | Vectorised numerics, random sampling |
| **SciPy** | Distribution fitting, KS tests |
| **Matplotlib** | Publication-quality figures |
| **Pandas** | Tabular data management |
| **tqdm** | Progress bars (future extensions) |

---

## Roadmap / TODOs

The following features are marked as `TODO` comments in the source code for future development:

| # | Feature | File |
|---|---|---|
| 1 | Support for multiple particle types (π, μ, e, p) | `config.py` |
| 2 | Full relativistic energy calculations (Lorentz boosts) | `physics.py` |
| 3 | Detector noise simulation (Gaussian smearing) | `physics.py` |
| 4 | ROOT file export (`.root` via `uproot`) | `dataset.py` |
| 5 | Parallel simulation (`multiprocessing`) | `montecarlo.py` |
| 6 | 3-D collision visualisation (`mplot3d` / Plotly) | `visualization.py` |
| 7 | Experiment configuration files (YAML / JSON) | `config.py` |

---

## License

This project is released for educational and portfolio purposes.
