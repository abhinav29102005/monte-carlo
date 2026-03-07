"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Settings2,
  BarChart3,
  Zap,
  Activity,
  Table,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
} from "recharts";
import {
  runSimulation,
  DEFAULT_CONFIG,
  mean,
  std,
  histogram,
  correlation,
  type SimConfig,
  type CollisionEvent,
} from "@/lib/simulation";
import AnimatedCounter from "@/components/AnimatedCounter";
import GlowCard from "@/components/GlowCard";
import FormulaBlock from "@/components/FormulaBlock";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function SimulationPage() {
  const [config, setConfig] = useState<SimConfig>({
    ...DEFAULT_CONFIG,
    numEvents: 10000,
  });
  const [events, setEvents] = useState<CollisionEvent[]>([]);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stats, setStats] = useState<{
    meanSqrtS: number;
    stdSqrtS: number;
    meanEA: number;
    corr: number;
    totalTime: number;
  } | null>(null);

  const handleRun = useCallback(() => {
    setRunning(true);
    setProgress(0);
    setEvents([]);
    setStats(null);

    setTimeout(() => {
      const t0 = performance.now();
      const result = runSimulation(config, (frac) => setProgress(frac));
      const t1 = performance.now();

      const sqrtSArr = result.map((e) => e.sqrtS);
      const eAArr = result.map((e) => e.energyA);
      const e1Arr = result.map((e) => e.finalEnergy1);
      const e2Arr = result.map((e) => e.finalEnergy2);

      setEvents(result);
      setStats({
        meanSqrtS: mean(sqrtSArr),
        stdSqrtS: std(sqrtSArr),
        meanEA: mean(eAArr),
        corr: correlation(e1Arr, e2Arr),
        totalTime: (t1 - t0) / 1000,
      });
      setRunning(false);
    }, 50);
  }, [config]);

  const sqrtSHist = events.length > 0
    ? histogram(events.map((e) => e.sqrtS), 50)
    : [];

  const scatterData = events.length > 0
    ? events.slice(0, 2000).map((e) => ({
      x: e.finalEnergy1,
      y: e.finalEnergy2,
    }))
    : [];

  return (
    <div className="pt-28 pb-32 bg-grid">
      <div className="mx-auto max-w-6xl px-6">
        {/* Header */}
        <motion.div
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.08 } },
          }}
          className="text-center mb-12"
        >
          <motion.span
            variants={fadeUp}
            className="inline-flex items-center gap-2 text-xs tracking-widest uppercase text-accent-cyan bg-accent-cyan/10 border border-accent-cyan/20 rounded-full px-4 py-1.5 mb-4"
          >
            <Zap className="w-3.5 h-3.5" />
            Interactive Engine
          </motion.span>
          <motion.h1
            variants={fadeUp}
            className="text-4xl sm:text-5xl font-extrabold tracking-tight section-heading mb-4"
          >
            Run Simulation
          </motion.h1>
          <motion.p
            variants={fadeUp}
            className="max-w-2xl mx-auto text-gray-400 leading-relaxed"
          >
            Configure parameters, generate collision events, and explore
            real-time statistical results — all in your browser.
          </motion.p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Configuration Panel */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-1"
          >
            <div className="glass p-6 sticky top-24">
              <div className="flex items-center gap-2 mb-6">
                <Settings2 className="w-5 h-5 text-accent-purple" />
                <h2 className="text-lg font-bold text-white">Configuration</h2>
              </div>

              <div className="space-y-5">
                {/* Event Count */}
                <div>
                  <label className="text-xs text-gray-400 font-medium block mb-2">
                    Number of Events
                  </label>
                  <input
                    type="range"
                    min={1000}
                    max={100000}
                    step={1000}
                    value={config.numEvents}
                    onChange={(e) =>
                      setConfig((c) => ({
                        ...c,
                        numEvents: parseInt(e.target.value),
                      }))
                    }
                    className="w-full accent-accent-cyan"
                  />
                  <span className="text-sm text-accent-cyan font-mono">
                    {config.numEvents.toLocaleString()}
                  </span>
                </div>

                {/* Energy Min */}
                <div>
                  <label className="text-xs text-gray-400 font-medium block mb-2">
                    Min Energy (GeV)
                  </label>
                  <input
                    type="range"
                    min={1}
                    max={config.energyMax - 1}
                    step={1}
                    value={config.energyMin}
                    onChange={(e) =>
                      setConfig((c) => ({
                        ...c,
                        energyMin: parseInt(e.target.value),
                      }))
                    }
                    className="w-full accent-accent-blue"
                  />
                  <span className="text-sm text-accent-blue font-mono">
                    {config.energyMin} GeV
                  </span>
                </div>

                {/* Energy Max */}
                <div>
                  <label className="text-xs text-gray-400 font-medium block mb-2">
                    Max Energy (GeV)
                  </label>
                  <input
                    type="range"
                    min={config.energyMin + 1}
                    max={1000}
                    step={1}
                    value={config.energyMax}
                    onChange={(e) =>
                      setConfig((c) => ({
                        ...c,
                        energyMax: parseInt(e.target.value),
                      }))
                    }
                    className="w-full accent-accent-purple"
                  />
                  <span className="text-sm text-accent-purple font-mono">
                    {config.energyMax} GeV
                  </span>
                </div>

                {/* Seed */}
                <div>
                  <label className="text-xs text-gray-400 font-medium block mb-2">
                    Random Seed
                  </label>
                  <input
                    type="number"
                    value={config.seed ?? 42}
                    onChange={(e) =>
                      setConfig((c) => ({
                        ...c,
                        seed: parseInt(e.target.value) || 42,
                      }))
                    }
                    className="w-full bg-surface-lighter border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono outline-none focus:border-accent-cyan/50 transition"
                  />
                </div>

                {/* Formula reminder */}
                <div className="pt-2">
                  <FormulaBlock
                    math="E \sim \mathcal{U}(E_{\min}, E_{\max})"
                    label="Energy sampling distribution"
                    className="text-xs"
                  />
                </div>
              </div>

              {/* Run Button */}
              <button
                onClick={handleRun}
                disabled={running}
                className="btn-primary w-full mt-6 py-3 rounded-xl text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="flex items-center justify-center gap-2">
                  {running ? (
                    <>
                      <Activity className="w-4 h-4 animate-pulse" />
                      Running...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      Run Simulation
                    </>
                  )}
                </span>
              </button>

              {/* Progress bar */}
              {running && (
                <div className="mt-3 h-1.5 bg-surface-lighter rounded-full overflow-hidden">
                  <motion.div
                    className="h-full progress-bar rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress * 100}%` }}
                    transition={{ duration: 0.1 }}
                  />
                </div>
              )}
            </div>
          </motion.div>

          {/* Results Panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="lg:col-span-2 space-y-6"
          >
            <AnimatePresence mode="wait">
              {events.length === 0 && !running ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="glass p-12 text-center"
                >
                  <BarChart3 className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-400 mb-2">
                    No simulation data yet
                  </h3>
                  <p className="text-sm text-gray-500">
                    Configure parameters and click &quot;Run Simulation&quot; to
                    generate collision events.
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="results"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-6"
                >
                  {/* Stat Cards */}
                  {stats && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        {
                          label: "Events",
                          value: events.length,
                          color: "cyan" as const,
                          textClass: "text-accent-cyan",
                        },
                        {
                          label: "Mean √s",
                          display: `${stats.meanSqrtS.toFixed(2)} GeV`,
                          color: "purple" as const,
                          textClass: "text-accent-purple",
                        },
                        {
                          label: "σ(√s)",
                          display: `${stats.stdSqrtS.toFixed(2)} GeV`,
                          color: "blue" as const,
                          textClass: "text-accent-blue",
                        },
                        {
                          label: "Time",
                          display: `${stats.totalTime.toFixed(3)} s`,
                          color: "green" as const,
                          textClass: "text-accent-green",
                        },
                      ].map((s, i) => (
                        <GlowCard
                          key={s.label}
                          glowColor={s.color}
                          delay={i * 0.05}
                        >
                          <div className="text-center">
                            <div className="text-xs text-gray-500 font-medium uppercase mb-1">
                              {s.label}
                            </div>
                            {"value" in s && s.value ? (
                              <AnimatedCounter
                                value={s.value}
                                className={`text-2xl font-bold ${s.textClass}`}
                              />
                            ) : (
                              <span
                                className={`text-2xl font-bold ${s.textClass}`}
                              >
                                {s.display}
                              </span>
                            )}
                          </div>
                        </GlowCard>
                      ))}
                    </div>
                  )}

                  {/* Invariant Mass Histogram */}
                  {sqrtSHist.length > 0 && (
                    <div className="glass p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <BarChart3 className="w-5 h-5 text-accent-purple" />
                        <h3 className="text-base font-bold text-white">
                          Invariant Mass Distribution (√s)
                        </h3>
                      </div>
                      <ResponsiveContainer width="100%" height={280}>
                        <AreaChart data={sqrtSHist}>
                          <defs>
                            <linearGradient
                              id="sqrtSGrad"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="0%"
                                stopColor="#a855f7"
                                stopOpacity={0.4}
                              />
                              <stop
                                offset="100%"
                                stopColor="#a855f7"
                                stopOpacity={0}
                              />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="x"
                            tick={{ fontSize: 11 }}
                            label={{
                              value: "√s (GeV)",
                              position: "insideBottomRight",
                              offset: -5,
                              style: { fill: "#9ca3af", fontSize: 11 },
                            }}
                          />
                          <YAxis tick={{ fontSize: 11 }} />
                          <Tooltip
                            contentStyle={{
                              background: "#1a1a3a",
                              border: "1px solid rgba(255,255,255,0.1)",
                              borderRadius: "8px",
                              color: "#e5e7eb",
                              fontSize: 12,
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="y"
                            stroke="#a855f7"
                            strokeWidth={2}
                            fill="url(#sqrtSGrad)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* Energy Scatter Plot */}
                  {scatterData.length > 0 && (
                    <div className="glass p-6">
                      <div className="flex items-center gap-2 mb-1">
                        <Activity className="w-5 h-5 text-accent-cyan" />
                        <h3 className="text-base font-bold text-white">
                          Final-State Energy Correlation
                        </h3>
                      </div>
                      {stats && (
                        <p className="text-xs text-gray-500 mb-4">
                          Pearson r ={" "}
                          <span className="text-accent-pink font-mono">
                            {stats.corr.toFixed(4)}
                          </span>{" "}
                          (anti-correlated by energy conservation)
                        </p>
                      )}
                      <ResponsiveContainer width="100%" height={280}>
                        <ScatterChart>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="x"
                            type="number"
                            tick={{ fontSize: 11 }}
                            label={{
                              value: "E₁ (GeV)",
                              position: "insideBottomRight",
                              offset: -5,
                              style: { fill: "#9ca3af", fontSize: 11 },
                            }}
                          />
                          <YAxis
                            dataKey="y"
                            type="number"
                            tick={{ fontSize: 11 }}
                            label={{
                              value: "E₂ (GeV)",
                              position: "insideTopLeft",
                              offset: 10,
                              style: { fill: "#9ca3af", fontSize: 11 },
                            }}
                          />
                          <Tooltip
                            contentStyle={{
                              background: "#1a1a3a",
                              border: "1px solid rgba(255,255,255,0.1)",
                              borderRadius: "8px",
                              color: "#e5e7eb",
                              fontSize: 12,
                            }}
                          />
                          <Scatter
                            data={scatterData}
                            fill="#00eaff"
                            fillOpacity={0.3}
                            r={2}
                          />
                        </ScatterChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* Event Table Preview */}
                  {events.length > 0 && (
                    <div className="glass p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <Table className="w-5 h-5 text-accent-green" />
                        <h3 className="text-base font-bold text-white">
                          Event Table Preview
                        </h3>
                        <span className="text-xs text-gray-500 ml-auto">
                          Showing first 10 of{" "}
                          {events.length.toLocaleString()} events
                        </span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs font-mono">
                          <thead>
                            <tr className="text-gray-500 border-b border-white/[0.06]">
                              <th className="text-left py-2 px-2">ID</th>
                              <th className="text-right py-2 px-2">E_A</th>
                              <th className="text-right py-2 px-2">E_B</th>
                              <th className="text-right py-2 px-2">θ</th>
                              <th className="text-right py-2 px-2">√s</th>
                              <th className="text-right py-2 px-2">E₁</th>
                              <th className="text-right py-2 px-2">E₂</th>
                            </tr>
                          </thead>
                          <tbody>
                            {events.slice(0, 10).map((e) => (
                              <tr
                                key={e.id}
                                className="border-b border-white/[0.03] text-gray-300 hover:bg-white/[0.02] transition"
                              >
                                <td className="py-2 px-2 text-gray-500">
                                  {e.id}
                                </td>
                                <td className="py-2 px-2 text-right text-accent-cyan">
                                  {e.energyA.toFixed(2)}
                                </td>
                                <td className="py-2 px-2 text-right text-accent-blue">
                                  {e.energyB.toFixed(2)}
                                </td>
                                <td className="py-2 px-2 text-right">
                                  {e.theta.toFixed(4)}
                                </td>
                                <td className="py-2 px-2 text-right text-accent-purple">
                                  {e.sqrtS.toFixed(2)}
                                </td>
                                <td className="py-2 px-2 text-right text-accent-pink">
                                  {e.finalEnergy1.toFixed(2)}
                                </td>
                                <td className="py-2 px-2 text-right text-accent-green">
                                  {e.finalEnergy2.toFixed(2)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
