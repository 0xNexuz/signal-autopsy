(function () {
  "use strict";

  var STORAGE_KEY = "signal-autopsy-receipts-v1";
  var state = {
    market: null,
    receipt: null,
    examiner: null,
    rows: [],
    timer: null
  };

  var $ = function (id) { return document.getElementById(id); };
  var clamp = function (value, min, max) { return Math.max(min, Math.min(max, Number(value))); };
  var escapeHtml = function (value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (character) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[character];
    });
  };

  var strategies = {
    "Session handoff momentum": "continue only when US-session momentum survives the handoff and token liquidity supports the requested size",
    "Overnight liquidity reversion": "fade the move only when overnight dislocation is not being driven by new company information",
    "Earnings event defense": "reduce directional exposure when scheduled or unscheduled event risk can overwhelm continuous token liquidity",
    "Index hedge rotation": "use the index token only when hedge size lowers net exposure and the unwind remains liquid"
  };

  function post(url, body) {
    return fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    }).then(async function (response) {
      var data = await response.json();
      if (!response.ok) {
        var error = new Error(data.error || (data.inspection && data.inspection.reason) || "Request failed");
        error.data = data;
        throw error;
      }
      return data;
    });
  }

  function storedReceipts() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
    catch (_) { return []; }
  }

  function persistReceipt(receipt) {
    var receipts = storedReceipts();
    receipts.unshift({ receipt: receipt, evaluation: null });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(receipts.slice(0, 50)));
  }

  function showToast(text) {
    $("toast").textContent = text;
    $("toast").classList.add("show");
    setTimeout(function () { $("toast").classList.remove("show"); }, 1700);
  }

  function generatedThesis() {
    var symbol = $("market").value;
    var strategy = $("strategy").value;
    var side = $("side").value;
    var confidence = Number($("confidence").value);
    var evidence = Number($("evidence").value);
    var eventRisk = Number($("eventRisk").value);
    return "Propose " + side + " " + symbol + " using " + strategy.toLowerCase() + ": " + strategies[strategy] + ". Agent confidence is " + confidence + "% against " + evidence + "/100 evidence quality; event risk is " + eventRisk + "/100. Invalidate if session, liquidity, or event conditions deteriorate before routing.";
  }

  function updateOutputs() {
    $("confidenceOut").textContent = $("confidence").value + "%";
    $("evidenceOut").textContent = $("evidence").value;
    $("eventRiskOut").textContent = $("eventRisk").value;
    $("driftOut").textContent = (Number($("drift").value) > 0 ? "+" : "") + Number($("drift").value).toFixed(1) + "%";
    $("depthOut").textContent = $("depth").value;
  }

  function updateThesis() {
    $("thesis").value = generatedThesis();
    updateOutputs();
  }

  function setProbing(active, copy) {
    if (active) {
      $("replayCard").classList.add("probing");
      $("probeOverlay").setAttribute("aria-hidden", "false");
      $("probeCopy").textContent = copy || "Checking six deterministic risk components and requesting an adversarial examination.";
      $("runProbe").disabled = true;
      $("runProbe").textContent = "Probing Reality intent...";
      $("verdict").textContent = "Probing intent";
      $("readout").textContent = $("probeCopy").textContent;
    } else {
      $("replayCard").classList.remove("probing");
      $("probeOverlay").setAttribute("aria-hidden", "true");
      $("runProbe").disabled = false;
      $("runProbe").textContent = "Run pre-mortem";
    }
  }

  function paintTimeline(score) {
    var values = [32, 54, 45, 68, 39, 73, 81, 57, 49, 64, 36, 52];
    $("timeline").innerHTML = values.map(function (value, index) {
      var height = clamp(value + (score - 55) * (index % 3 === 0 ? 0.32 : -0.12), 18, 94);
      return '<span class="tick" style="height:' + height + '%"></span>';
    }).join("");
  }

  function previewDecision() {
    var market = state.market || {
      session: { score: 72, phase: "overnight", status: "SIMULATED" },
      depthQuality: Number($("depth").value),
      depthNotional: Number($("depthNotional").value),
      volatilityRisk: 40
    };
    var components = {
      session: market.session.score,
      liquidity: 100 - Number($("depth").value),
      event: Number($("eventRisk").value),
      volatility: market.volatilityRisk,
      size: clamp((Number($("notional").value) / Math.max(Number($("depthNotional").value), 1)) * 500, 0, 100),
      overconfidence: clamp(Number($("confidence").value) - Number($("evidence").value) + 35, 0, 100)
    };
    var score = Math.round(components.session * 0.14 + components.liquidity * 0.2 + components.event * 0.16 + components.volatility * 0.18 + components.size * 0.18 + components.overconfidence * 0.14);
    renderDecision({ score: score, route: score >= 72 ? "BLOCK" : score >= 56 ? "PAPER_ONLY" : score >= 38 ? "CLAMP" : "ALLOW", components: components, authorization: { maxNotional: score >= 72 || score >= 56 ? 0 : score >= 38 ? Number($("notional").value) * 0.35 : Number($("notional").value), expiresInSeconds: score < 38 ? 300 : 120 } }, true);
  }

  function routeLabel(route) {
    return { BLOCK: "Block live routing", PAPER_ONLY: "Paper only", CLAMP: "Clamp route", ALLOW: "Allow route" }[route] || route;
  }

  function renderDecision(decision, preview) {
    var score = Math.round(decision.score);
    var route = decision.route;
    $("score").textContent = score;
    $("dial").style.setProperty("--score", score);
    $("verdict").textContent = routeLabel(route);
    $("readout").textContent = preview
      ? "SIMULATED preview. Submit the pre-mortem to receive a server-signed authorization receipt."
      : "Deterministic decision issued. Qwen evidence is attached for review but cannot change this route.";
    var labels = {
      session: "Session",
      liquidity: "Liquidity",
      event: "Event",
      volatility: "Volatility",
      size: "Size",
      overconfidence: "Overconfidence"
    };
    $("findings").innerHTML = Object.keys(labels).map(function (key) {
      return '<div class="finding"><b>' + labels[key] + '</b>' + Math.round(decision.components[key]) + '/100 deterministic component.</div>';
    }).join("");
    $("heroVerdict").textContent = routeLabel(route);
    $("heroDecision").textContent = "Signed cap: " + Number(decision.authorization.maxNotional).toFixed(2) + " USDT; receipt expires in " + decision.authorization.expiresInSeconds + " seconds.";
    [["heroM1", "heroV1", "session"], ["heroM2", "heroV2", "liquidity"], ["heroM3", "heroV3", "size"]].forEach(function (entry) {
      var value = Math.round(decision.components[entry[2]]);
      $(entry[0]).style.width = value + "%";
      $(entry[1]).textContent = value;
    });
    paintTimeline(score);
    renderPlaybook(decision, preview);
  }

  function renderPlaybook(decision, preview) {
    var market = state.market || {};
    var receipt = state.receipt;
    var lines = [
      "SIGNAL AUTOPSY ROUTE CONTRACT",
      "status = " + (preview ? "SIMULATED_PREVIEW" : "SIGNED"),
      "symbol = " + $("market").value,
      "side = " + $("side").value,
      "score = " + decision.score,
      "route = " + decision.route,
      "max_notional_usdt = " + decision.authorization.maxNotional,
      "expires_in_seconds = " + decision.authorization.expiresInSeconds,
      "session = " + ((market.session && market.session.phase) || "simulated"),
      "receipt_id = " + (receipt ? receipt.payload.receiptId : "pending"),
      "signature = " + (receipt ? receipt.signatureStatus : "pending"),
      "",
      "checks = signature, expiry, symbol, side, route, notional"
    ];
    $("playbookText").textContent = lines.join("\n");
  }

  function renderExaminer(result) {
    state.examiner = result.examination;
    $("qwenStatus").className = "status-tag " + (result.status === "REAL" ? "real" : "demo");
    $("qwenStatus").textContent = result.status + " " + result.provider;
    var examination = result.examination;
    $("examinerOutput").innerHTML =
      "<strong>Strongest countercase</strong>" + escapeHtml(examination.strongestCountercase) +
      "<strong style=\"margin-top:12px\">Hidden assumptions</strong>" + examination.hiddenAssumptions.map(escapeHtml).join(" / ") +
      "<strong style=\"margin-top:12px\">Evidence requests</strong>" + examination.evidenceRequests.map(escapeHtml).join(" / ");
  }

  async function refreshMarket(silent) {
    if (!silent) setProbing(true, "Loading Bitget Reality ticker and candles through Agent Hub / UTA v3.");
    $("marketStatus").textContent = "Loading " + $("market").value + " from Bitget Reality...";
    try {
      var response = await fetch("/api/reality-market?symbol=" + encodeURIComponent($("market").value), { cache: "no-store" });
      var data = await response.json();
      if (!response.ok) throw new Error(data.error || "Reality data unavailable");
      state.market = data.market;
      $("drift").value = clamp(data.market.drift24hPercent, -15, 15);
      $("depth").value = clamp(data.market.depthQuality, 5, 100);
      $("depthNotional").value = Math.round(data.market.depthNotional);
      $("marketDot").className = "live-dot ok";
      $("marketStatus").textContent = "REAL " + data.market.symbol + " " + data.market.price + " USDT; " + data.market.session.phase + "; liquidity " + data.market.sources.liquidity.status + ".";
      updateOutputs();
      previewDecision();
      return data.market;
    } catch (error) {
      $("marketDot").className = "live-dot warn";
      $("marketStatus").textContent = "BLOCKED live data: " + error.message + ". SIMULATED preview remains available.";
      if (!state.market) {
        state.market = { symbol: $("market").value, observedAt: new Date().toISOString(), price: 100, drift24hPercent: Number($("drift").value), depthQuality: Number($("depth").value), depthNotional: Number($("depthNotional").value), volatilityRisk: 40, session: { score: 72, phase: "overnight", status: "SIMULATED" }, sources: { ticker: { status: "SIMULATED" }, candles: { status: "SIMULATED" }, liquidity: { status: "SIMULATED" } } };
      }
      throw error;
    } finally {
      if (!silent) setProbing(false);
    }
  }

  function autopsyInput(examiner) {
    return {
      market: {
        symbol: $("market").value,
        observedAt: state.market.observedAt,
        price: state.market.price,
        session: state.market.session,
        sources: state.market.sources
      },
      intent: {
        side: $("side").value,
        notional: Number($("notional").value),
        strategy: $("strategy").value
      },
      thesis: $("thesis").value.trim(),
      examiner: examiner,
      risk: {
        depthQuality: Number($("depth").value),
        depthNotional: Number($("depthNotional").value),
        orderNotional: Number($("notional").value),
        eventRisk: Number($("eventRisk").value),
        volatilityRisk: state.market.volatilityRisk,
        confidence: Number($("confidence").value),
        evidenceQuality: Number($("evidence").value)
      }
    };
  }

  async function runAutopsy(event) {
    event.preventDefault();
    setProbing(true);
    try {
      await refreshMarket(true);
      var examinerResult = await post("/api/examine-thesis", {
        symbol: $("market").value,
        thesis: $("thesis").value.trim(),
        strategy: $("strategy").value,
        confidence: Number($("confidence").value),
        evidenceQuality: Number($("evidence").value),
        session: state.market.session
      });
      renderExaminer(examinerResult);
      var result = await post("/api/autopsy", autopsyInput(examinerResult));
      state.receipt = result.receipt;
      persistReceipt(result.receipt);
      renderDecision(result.receipt.payload.decision, false);
      renderLedger();
      $("executionPanel").innerHTML = "<strong>Signed receipt ready</strong>" + escapeHtml(result.receipt.payload.receiptId) + " / " + escapeHtml(result.receipt.signatureStatus) + " signature. Route gate has not been called.";
      showToast("Signed autopsy receipt stored");
    } catch (error) {
      $("readout").textContent = "Autopsy blocked: " + error.message;
      showToast("Autopsy blocked");
    } finally {
      setProbing(false);
    }
  }

  function renderLedger() {
    var receipts = storedReceipts();
    var classes = { ALLOW: "green", CLAMP: "amber", PAPER_ONLY: "amber", BLOCK: "red" };
    $("ledgerRows").innerHTML = '<div class="row"><span>Time</span><span>Signal</span><span>Route</span><span>Score</span></div>' +
      receipts.slice(0, 5).map(function (item) {
        var payload = item.receipt.payload;
        return '<div class="row"><span class="mono">' + new Date(payload.issuedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) + '</span><span>' + escapeHtml(payload.market.symbol + " " + payload.intent.strategy) + '</span><span><span class="badge ' + classes[payload.decision.route] + '">' + payload.decision.route + '</span></span><span class="mono">' + payload.decision.score + '/100</span></div>';
      }).join("");
  }

  async function enforceRoute() {
    if (!state.receipt) return showToast("Run a signed pre-mortem first");
    $("executionPanel").innerHTML = "<strong>Gate checking receipt</strong>Validating signature, expiry, symbol, side, route, and notional cap.";
    try {
      var notional = Number($("notional").value);
      var result = await post("/api/route-gate", {
        receipt: state.receipt,
        order: { symbol: $("market").value, side: $("side").value, orderType: "market", notional: notional, size: notional / state.market.price }
      });
      $("executionPanel").innerHTML = "<strong>" + result.execution + " execution</strong>" + escapeHtml(result.inspection.reason) + (result.simulatedOrderId ? " Order " + escapeHtml(result.simulatedOrderId) + "." : "");
      showToast("Route gate: " + result.execution);
    } catch (error) {
      var data = error.data || {};
      $("executionPanel").innerHTML = "<strong>DENIED</strong>" + escapeHtml((data.inspection && data.inspection.reason) || error.message);
      showToast("Route denied");
    }
  }

  async function evaluateMemory() {
    var receipts = storedReceipts();
    if (!receipts.length) return showToast("No receipt to evaluate");
    var item = receipts[0];
    $("memoryStatus").textContent = "Loading a later Reality price and verifying the original receipt...";
    try {
      var response = await fetch("/api/reality-market?symbol=" + encodeURIComponent(item.receipt.payload.market.symbol), { cache: "no-store" });
      var data = await response.json();
      if (!response.ok) throw new Error(data.error || "Outcome price unavailable");
      var result = await post("/api/evaluate-memory", { receipt: item.receipt, outcome: { price: data.market.price, observedAt: data.market.observedAt } });
      receipts[0].evaluation = result;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(receipts));
      $("memoryStatus").textContent = result.evaluation.verdict + ": side-adjusted move " + result.evaluation.returnPct + "%. Evaluation signature " + result.signatureStatus + ".";
      showToast("Failure Memory evaluated");
    } catch (error) {
      $("memoryStatus").textContent = "Evaluation blocked: " + error.message;
    }
  }

  function copyGuardrail() {
    navigator.clipboard.writeText($("playbookText").textContent).then(function () { showToast("Guardrail copied"); }).catch(function () { showToast("Copy unavailable"); });
  }

  function exportPolicy() {
    if (!state.receipt) return showToast("Run a signed pre-mortem first");
    var blob = new Blob([JSON.stringify(state.receipt, null, 2)], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.download = "signal-autopsy-" + state.receipt.payload.receiptId + ".json";
    link.click();
    URL.revokeObjectURL(url);
    showToast("Signed receipt exported");
  }

  async function loadBenchmark() {
    try {
      var response = await fetch("/api/benchmark", { cache: "no-store" });
      var data = await response.json();
      if (!response.ok) throw new Error(data.error || "Benchmark unavailable");
      $("benchAlone").textContent = data.metrics.agentAloneDrawdownPercent + "%";
      $("benchHarness").textContent = data.metrics.harnessDrawdownPercent + "%";
      $("benchDelta").textContent = data.metrics.drawdownReductionPoints + " pts";
      $("benchCount").textContent = data.scenarios + " frozen scenarios";
      $("benchmarkNote").textContent = "Frozen at " + data.frozenAsOf.slice(0, 10) + ". REAL Bitget Reality daily candles; SIMULATED fixed agent intents and safety policy. Dataset " + data.datasetHash.slice(0, 12) + ".";
    } catch (error) {
      $("benchmarkNote").textContent = "Benchmark blocked: " + error.message;
    }
  }

  $("autopsyForm").addEventListener("submit", runAutopsy);
  ["strategy", "side", "confidence", "evidence", "eventRisk", "notional"].forEach(function (id) {
    $(id).addEventListener("input", function () {
      clearTimeout(state.timer);
      updateThesis();
      state.timer = setTimeout(previewDecision, 180);
    });
  });
  $("market").addEventListener("change", function () {
    state.market = null;
    state.receipt = null;
    updateThesis();
    refreshMarket(false).catch(function () {});
  });
  $("refreshMarket").addEventListener("click", function () { refreshMarket(false).catch(function () {}); });
  $("copyPlaybook").addEventListener("click", copyGuardrail);
  $("exportPolicy").addEventListener("click", exportPolicy);
  $("enforceRoute").addEventListener("click", enforceRoute);
  $("evaluateMemory").addEventListener("click", evaluateMemory);

  updateThesis();
  renderLedger();
  previewDecision();
  loadBenchmark();
  refreshMarket(false).catch(function () {});
}());
