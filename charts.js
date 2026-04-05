// Charts — Humanitarian Arrivals Dashboard

Chart.defaults.color = '#8892a4';
Chart.defaults.borderColor = '#2e3350';
Chart.defaults.font.family = "'Segoe UI', system-ui, sans-serif";
Chart.defaults.font.size = 11;

var C = {
  blue:'#4f8ef7', green:'#34d399', amber:'#f59e0b', red:'#f87171',
  purple:'#a78bfa', orange:'#fb923c', teal:'#2dd4bf'
};
var RC = {
  Africa:C.amber, Asia:C.blue, Europe:C.purple,
  NorthAmerica:C.green, SouthAmerica:C.orange
};

function fmt(n) {
  if (n >= 1e6) return (n/1e6).toFixed(2)+'M';
  if (n >= 1e3) return Math.round(n/1e3)+'K';
  return n.toLocaleString();
}
function fmtFull(n) { return n.toLocaleString(); }
function rgba(hex, a) {
  var r=parseInt(hex.slice(1,3),16), g=parseInt(hex.slice(3,5),16), b=parseInt(hex.slice(5,7),16);
  return 'rgba('+r+','+g+','+b+','+a+')';
}
function lineds(label, data, color, fill) {
  return {
    label:label, data:data, borderColor:color,
    backgroundColor: fill ? rgba(color,0.15) : 'transparent',
    borderWidth:2, pointRadius:3, pointHoverRadius:5, tension:0.3, fill:!!fill
  };
}
function bards(label, data, color) {
  return {
    label:label, data:data,
    backgroundColor:rgba(color,0.8), borderColor:color, borderWidth:1, borderRadius:3
  };
}

var TT = {
  plugins: {
    tooltip: {
      backgroundColor:'#1a1d27', borderColor:'#2e3350', borderWidth:1,
      titleColor:'#e2e8f0', bodyColor:'#8892a4', padding:10,
      callbacks: { label: function(ctx) { return ' '+ctx.dataset.label+': '+(ctx.parsed.y != null ? ctx.parsed.y.toLocaleString() : 'N/A'); } }
    },
    legend: { labels: { boxWidth:12, padding:16 } }
  }
};
var NOLG = {
  plugins: {
    tooltip: TT.plugins.tooltip,
    legend: { display:false }
  }
};
var SC = {
  x: { grid:{color:'#2e3350'}, ticks:{maxRotation:45} },
  y: { grid:{color:'#2e3350'}, ticks:{ callback: function(v){ return fmt(v); } } }
};

// High/low annotation plugin
function hlPlugin(data, color) {
  var vals = data.map(function(d){ return d.total !== undefined ? d.total : d; });
  var maxV = Math.max.apply(null,vals), minV = Math.min.apply(null,vals);
  var maxI = vals.indexOf(maxV), minI = vals.indexOf(minV);
  return {
    id:'hl',
    afterDatasetsDraw: function(chart) {
      var ctx=chart.ctx, x=chart.scales.x, y=chart.scales.y;
      [[maxI,maxV,'High'],[minI,minV,'Low']].forEach(function(item){
        var xi=x.getPixelForIndex(item[0]), yi=y.getPixelForValue(item[1]);
        ctx.save();
        ctx.fillStyle=color;
        ctx.font='bold 10px Segoe UI,sans-serif';
        ctx.textAlign='center';
        ctx.fillText((item[2]==='High'?'▲ High: ':'▼ Low: ')+fmt(item[1]), xi, yi+(item[2]==='High'?-8:14));
        ctx.restore();
      });
    }
  };
}

// Tab navigation
document.querySelectorAll('#nav button').forEach(function(btn){
  btn.addEventListener('click', function(){
    document.querySelectorAll('#nav button').forEach(function(b){ b.classList.remove('active'); });
    document.querySelectorAll('.tab-panel').forEach(function(p){ p.classList.remove('active'); });
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab).classList.add('active');
  });
});

// KPI cards
var k = immigrationData.kpi2022;
document.getElementById('kpi-lpr').textContent = k.lpr.toLocaleString();
document.getElementById('kpi-nat').textContent = k.naturalizations.toLocaleString();
document.getElementById('kpi-ref').textContent = k.refugees.toLocaleString();
document.getElementById('kpi-asy').textContent = k.asylumGranted.toLocaleString();

// ── OVERVIEW ──────────────────────────────────────────────────────────────────
var lprData = immigrationData.lprTotal;
new Chart(document.getElementById('overviewLPR'), {
  type:'line',
  data:{ labels:lprData.map(function(d){return d.year;}), datasets:[lineds('Green Cards',lprData.map(function(d){return d.total;}),C.blue,true)] },
  options:{ responsive:true, maintainAspectRatio:false, scales:SC, plugins:NOLG.plugins },
  plugins:[hlPlugin(lprData,C.blue)]
});

var natAll = immigrationData.naturalizations.filter(function(d){return d.year>=2000;});
new Chart(document.getElementById('overviewNat'), {
  type:'bar',
  data:{ labels:natAll.map(function(d){return d.year;}), datasets:[bards('Naturalizations',natAll.map(function(d){return d.total;}),C.green)] },
  options:{ responsive:true, maintainAspectRatio:false, scales:SC, plugins:NOLG.plugins },
  plugins:[hlPlugin(natAll,C.green)]
});

new Chart(document.getElementById('overviewRef'), {
  type:'line',
  data:{ labels:immigrationData.refugeeArrivals.map(function(d){return d.year;}), datasets:[lineds('Refugee Arrivals',immigrationData.refugeeArrivals.map(function(d){return d.total;}),C.amber,true)] },
  options:{ responsive:true, maintainAspectRatio:false, scales:SC, plugins:TT.plugins }
});

new Chart(document.getElementById('overviewAsy'), {
  type:'line',
  data:{
    labels:immigrationData.asylumGranted.map(function(d){return d.year;}),
    datasets:[
      lineds('Total',immigrationData.asylumGranted.map(function(d){return d.total;}),C.red,true),
      lineds('Affirmative',immigrationData.asylumGranted.map(function(d){return d.affirmative;}),C.purple,false),
      lineds('Defensive',immigrationData.asylumGranted.map(function(d){return d.defensive;}),C.orange,false)
    ]
  },
  options:{ responsive:true, maintainAspectRatio:false, scales:SC, plugins:TT.plugins }
});

// ── REFUGEES ──────────────────────────────────────────────────────────────────
var refData  = immigrationData.refugeeArrivals;
var refYears = refData.map(function(d){return d.year;});
var refVals  = refData.map(function(d){return d.total;});
var refAvg   = Math.round(refVals.reduce(function(a,b){return a+b;},0)/refVals.length);

var showDem = false, showRep = false;

function adminPlugin() {
  return {
    id:'admin',
    beforeDraw: function(chart) {
      if (!showDem && !showRep) return;
      var ctx=chart.ctx, x=chart.scales.x, y=chart.scales.y;
      var top=y.top, bottom=y.bottom;
      immigrationData.administrations.forEach(function(adm){
        if (adm.party==='D' && !showDem) return;
        if (adm.party==='R' && !showRep) return;
        var si = refYears.indexOf(adm.start);
        var ei = refYears.indexOf(Math.min(adm.end, refYears[refYears.length-1]));
        if (si < 0) return;
        var x1 = x.getPixelForIndex(Math.max(si,0));
        var x2 = x.getPixelForIndex(ei >= 0 ? ei : refYears.length-1);
        ctx.save();
        ctx.fillStyle = adm.party==='D' ? 'rgba(79,142,247,0.12)' : 'rgba(248,113,113,0.12)';
        ctx.fillRect(x1, top, x2-x1, bottom-top);
        ctx.fillStyle = adm.party==='D' ? 'rgba(79,142,247,0.8)' : 'rgba(248,113,113,0.8)';
        ctx.font = '9px Segoe UI,sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(adm.name, (x1+x2)/2, top+10);
        ctx.restore();
      });
    }
  };
}

var refChart = new Chart(document.getElementById('refTimeline'), {
  type:'bar',
  data:{
    labels:refYears,
    datasets:[
      bards('Refugee Arrivals', refVals, C.amber),
      { label:'Average ('+fmt(refAvg)+')', data:refYears.map(function(){return refAvg;}),
        type:'line', borderColor:C.teal, borderWidth:2, borderDash:[6,4],
        pointRadius:0, fill:false, tension:0 }
    ]
  },
  options:{ responsive:true, maintainAspectRatio:false, scales:SC, plugins:{ tooltip:TT.plugins.tooltip, legend:{display:false} } },
  plugins:[adminPlugin()]
});

document.getElementById('toggleDem').addEventListener('click', function(){
  showDem = !showDem;
  this.classList.toggle('active-dem', showDem);
  refChart.update();
});
document.getElementById('toggleRep').addEventListener('click', function(){
  showRep = !showRep;
  this.classList.toggle('active-rep', showRep);
  refChart.update();
});

var rr = immigrationData.refugeeByRegion;
new Chart(document.getElementById('refRegion'), {
  type:'bar',
  data:{ labels:rr.years, datasets:[
    bards('Africa',rr.Africa,RC.Africa), bards('Asia',rr.Asia,RC.Asia),
    bards('Europe',rr.Europe,RC.Europe), bards('North America',rr.NorthAmerica,RC.NorthAmerica),
    bards('South America',rr.SouthAmerica,RC.SouthAmerica)
  ]},
  options:{ responsive:true, maintainAspectRatio:false,
    scales:{ x:{grid:{color:'#2e3350'},stacked:true}, y:{grid:{color:'#2e3350'},stacked:true,ticks:{callback:function(v){return fmt(v);}}} },
    plugins:TT.plugins }
});

var rn = immigrationData.refugeeTopNationalities2022;
new Chart(document.getElementById('refNat'), {
  type:'bar',
  data:{ labels:rn.map(function(d){return d.country;}), datasets:[bards('Arrivals',rn.map(function(d){return d.arrivals;}),C.amber)] },
  options:{ indexAxis:'y', responsive:true, maintainAspectRatio:false,
    scales:{ x:{grid:{color:'#2e3350'},ticks:{callback:function(v){return fmt(v);}}}, y:{grid:{color:'#2e3350'}} },
    plugins:NOLG.plugins }
});

(function(){
  var t=document.getElementById('refTable');
  var max=Math.max.apply(null,rn.map(function(d){return d.arrivals;}));
  t.innerHTML='<thead><tr><th>#</th><th>Country</th><th class="num">Arrivals</th><th>Share</th></tr></thead>';
  var tb=document.createElement('tbody');
  rn.forEach(function(d,i){
    var pct=((d.arrivals/25519)*100).toFixed(1);
    var w=Math.round((d.arrivals/max)*120);
    tb.innerHTML+='<tr><td>'+(i+1)+'</td><td>'+d.country+'</td><td class="num">'+fmtFull(d.arrivals)+'</td><td><div class="bar-cell"><div class="mini-bar" style="width:'+w+'px;background:'+C.amber+'"></div><span>'+pct+'%</span></div></td></tr>';
  });
  t.appendChild(tb);
})();

// ── ASYLUM ────────────────────────────────────────────────────────────────────
var asyData    = immigrationData.asylumGranted;
var asyNatData = immigrationData.asylumTopNationalities2022;

var asyFilter = document.getElementById('asyCountryFilter');
asyNatData.slice().sort(function(a,b){return a.country.localeCompare(b.country);}).forEach(function(d){
  var o=document.createElement('option'); o.value=d.country; o.textContent=d.country;
  asyFilter.appendChild(o);
});

new Chart(document.getElementById('asyTimeline'), {
  type:'line',
  data:{
    labels:asyData.map(function(d){return d.year;}),
    datasets:[
      { label:'Affirmative', data:asyData.map(function(d){return d.affirmative;}), borderColor:C.purple, backgroundColor:rgba(C.purple,0.3), borderWidth:2, pointRadius:3, tension:0.3, fill:true },
      { label:'Defensive',   data:asyData.map(function(d){return d.defensive;}),   borderColor:C.orange, backgroundColor:rgba(C.orange,0.3), borderWidth:2, pointRadius:3, tension:0.3, fill:true }
    ]
  },
  options:{ responsive:true, maintainAspectRatio:false, scales:SC, plugins:TT.plugins }
});

var asyNatChart = new Chart(document.getElementById('asyNat'), {
  type:'bar',
  data:{ labels:asyNatData.map(function(d){return d.country;}), datasets:[bards('Affirmative Grants',asyNatData.map(function(d){return d.granted;}),C.purple)] },
  options:{ indexAxis:'y', responsive:true, maintainAspectRatio:false,
    scales:{ x:{grid:{color:'#2e3350'},ticks:{callback:function(v){return fmt(v);}}}, y:{grid:{color:'#2e3350'}} },
    plugins:NOLG.plugins }
});

new Chart(document.getElementById('asyPie'), {
  type:'doughnut',
  data:{
    labels:['Affirmative (USCIS)','Defensive (Courts)'],
    datasets:[{ data:[14134,22481], backgroundColor:[rgba(C.purple,0.8),rgba(C.orange,0.8)], borderColor:[C.purple,C.orange], borderWidth:2 }]
  },
  options:{ responsive:true, maintainAspectRatio:false,
    plugins:{ tooltip:{ backgroundColor:'#1a1d27', borderColor:'#2e3350', borderWidth:1, titleColor:'#e2e8f0', bodyColor:'#8892a4', padding:10, callbacks:{label:function(ctx){return ' '+ctx.label+': '+ctx.parsed.toLocaleString();}} }, legend:{position:'bottom',labels:{boxWidth:12,padding:16}} } }
});

asyFilter.addEventListener('change', function(){
  var val=this.value, note=document.getElementById('asyFilterNote'), filtered;
  if (val==='all') { filtered=asyNatData; note.textContent=''; }
  else {
    filtered=asyNatData.filter(function(d){return d.country===val;});
    note.textContent = filtered.length ? 'Showing '+val+' — '+filtered[0].granted.toLocaleString()+' affirmative grants FY 2022' : 'Not in top-10.';
  }
  asyNatChart.data.labels=filtered.map(function(d){return d.country;});
  asyNatChart.data.datasets[0].data=filtered.map(function(d){return d.granted;});
  asyNatChart.update();
});

(function(){
  var t=document.getElementById('asyTable');
  var rows=asyData.slice().reverse();
  t.innerHTML='<thead><tr><th>Year</th><th class="num">Total</th><th class="num">Affirmative</th><th class="num">Defensive</th><th>Aff. Share</th></tr></thead>';
  var tb=document.createElement('tbody');
  rows.forEach(function(d){
    var pct=((d.affirmative/d.total)*100).toFixed(1);
    var w=Math.round((d.affirmative/d.total)*80);
    tb.innerHTML+='<tr><td>'+d.year+'</td><td class="num">'+fmtFull(d.total)+'</td><td class="num">'+fmtFull(d.affirmative)+'</td><td class="num">'+fmtFull(d.defensive)+'</td><td><div class="bar-cell"><div class="mini-bar" style="width:'+w+'px;background:'+C.purple+'"></div><span>'+pct+'%</span></div></td></tr>';
  });
  t.appendChild(tb);
})();

// ── LPR ───────────────────────────────────────────────────────────────────────
new Chart(document.getElementById('lprTimeline'), {
  type:'line',
  data:{ labels:immigrationData.lprTotal.map(function(d){return d.year;}), datasets:[lineds('Green Cards',immigrationData.lprTotal.map(function(d){return d.total;}),C.blue,true)] },
  options:{ responsive:true, maintainAspectRatio:false, scales:SC, plugins:NOLG.plugins }
});

var lc=immigrationData.lprByClass;
new Chart(document.getElementById('lprClass'), {
  type:'bar',
  data:{ labels:lc.years, datasets:[
    bards('Immediate Relatives',lc.immediateRelatives,C.blue),
    bards('Family Sponsored',lc.familySponsored,C.green),
    bards('Employment Based',lc.employmentBased,C.amber),
    bards('Diversity',lc.diversity,C.purple),
    bards('Refugees/Asylees',lc.refugeesAsylees,C.red)
  ]},
  options:{ responsive:true, maintainAspectRatio:false,
    scales:{ x:{grid:{color:'#2e3350'},stacked:true}, y:{grid:{color:'#2e3350'},stacked:true,ticks:{callback:function(v){return fmt(v);}}} },
    plugins:TT.plugins }
});

var lr=immigrationData.lprByRegion;
new Chart(document.getElementById('lprRegion'), {
  type:'line',
  data:{ labels:lr.years, datasets:[
    lineds('Africa',lr.Africa,RC.Africa,false), lineds('Asia',lr.Asia,RC.Asia,false),
    lineds('Europe',lr.Europe,RC.Europe,false), lineds('North America',lr.NorthAmerica,RC.NorthAmerica,false),
    lineds('South America',lr.SouthAmerica,RC.SouthAmerica,false)
  ]},
  options:{ responsive:true, maintainAspectRatio:false, scales:SC, plugins:TT.plugins }
});

var lc2=immigrationData.lprTopCountries2022;
new Chart(document.getElementById('lprCountry'), {
  type:'bar',
  data:{ labels:lc2.map(function(d){return d.country;}), datasets:[bards('LPR Admissions',lc2.map(function(d){return d.total;}),C.blue)] },
  options:{ indexAxis:'y', responsive:true, maintainAspectRatio:false,
    scales:{ x:{grid:{color:'#2e3350'},ticks:{callback:function(v){return fmt(v);}}}, y:{grid:{color:'#2e3350'}} },
    plugins:NOLG.plugins }
});

(function(){
  var t=document.getElementById('lprStateTable');
  var data=immigrationData.lprByState2022.slice().sort(function(a,b){return b.total-a.total;});
  var max=data[0].total;
  t.innerHTML='<thead><tr><th>#</th><th>State</th><th class="num">LPR Admissions</th><th>Share of Total</th></tr></thead>';
  var tb=document.createElement('tbody');
  data.forEach(function(d,i){
    var pct=((d.total/1018349)*100).toFixed(1);
    var w=Math.round((d.total/max)*140);
    tb.innerHTML+='<tr><td>'+(i+1)+'</td><td>'+d.state+'</td><td class="num">'+fmtFull(d.total)+'</td><td><div class="bar-cell"><div class="mini-bar" style="width:'+w+'px;background:'+C.blue+'"></div><span>'+pct+'%</span></div></td></tr>';
  });
  t.appendChild(tb);
})();

// ── NATURALIZATIONS ───────────────────────────────────────────────────────────
var natYears = immigrationData.naturalizations.map(function(d){return d.year;});
var refByYear = {};
immigrationData.refugeeArrivals.forEach(function(d){ refByYear[d.year]=d.total; });
var refEligible = natYears.map(function(yr){ return refByYear[yr-6] || null; });

new Chart(document.getElementById('natTimeline'), {
  type:'line',
  data:{
    labels:natYears,
    datasets:[
      { label:'Persons who Received Citizenship',
        data:immigrationData.naturalizations.map(function(d){return d.total;}),
        borderColor:C.green, backgroundColor:rgba(C.green,0.15),
        borderWidth:2, pointRadius:3, tension:0.3, fill:true },
      { label:'Refugees eligible for citizenship (arrived ~6 yrs prior)',
        data:refEligible,
        borderColor:C.amber, backgroundColor:'transparent',
        borderWidth:2, borderDash:[6,4],
        pointRadius:4, pointBackgroundColor:C.amber,
        tension:0.3, fill:false }
    ]
  },
  options:{
    responsive:true, maintainAspectRatio:false, scales:SC,
    plugins:{
      tooltip:{ backgroundColor:'#1a1d27', borderColor:'#2e3350', borderWidth:1, titleColor:'#e2e8f0', bodyColor:'#8892a4', padding:10,
        callbacks:{label:function(ctx){return ' '+ctx.dataset.label+': '+(ctx.parsed.y!=null?ctx.parsed.y.toLocaleString():'N/A');}} },
      legend:{ display:true, labels:{ boxWidth:14, padding:14,
        generateLabels:function(chart){
          return chart.data.datasets.map(function(ds,i){
            return { text:ds.label, fillStyle:ds.borderColor, strokeStyle:ds.borderColor,
              lineWidth:2, lineDash:ds.borderDash||[], hidden:false, datasetIndex:i };
          });
        }
      }}
    }
  }
});

var nr=immigrationData.naturalizationsByRegion;
new Chart(document.getElementById('natRegion'), {
  type:'bar',
  data:{ labels:nr.years, datasets:[
    bards('Africa',nr.Africa,RC.Africa), bards('Asia',nr.Asia,RC.Asia),
    bards('Europe',nr.Europe,RC.Europe), bards('North America',nr.NorthAmerica,RC.NorthAmerica),
    bards('South America',nr.SouthAmerica,RC.SouthAmerica)
  ]},
  options:{ responsive:true, maintainAspectRatio:false,
    scales:{ x:{grid:{color:'#2e3350'},stacked:true}, y:{grid:{color:'#2e3350'},stacked:true,ticks:{callback:function(v){return fmt(v);}}} },
    plugins:TT.plugins }
});

var nc=immigrationData.naturalizationTopCountries2022;
new Chart(document.getElementById('natCountry'), {
  type:'bar',
  data:{ labels:nc.map(function(d){return d.country;}), datasets:[bards('Naturalizations',nc.map(function(d){return d.total;}),C.green)] },
  options:{ indexAxis:'y', responsive:true, maintainAspectRatio:false,
    scales:{ x:{grid:{color:'#2e3350'},ticks:{callback:function(v){return fmt(v);}}}, y:{grid:{color:'#2e3350'}} },
    plugins:NOLG.plugins }
});

(function(){
  var t=document.getElementById('natTable');
  var data=nc.slice().sort(function(a,b){return b.total-a.total;});
  var max=data[0].total;
  t.innerHTML='<thead><tr><th>#</th><th>Country</th><th class="num">Naturalizations</th><th>Share</th></tr></thead>';
  var tb=document.createElement('tbody');
  data.forEach(function(d,i){
    var pct=((d.total/969380)*100).toFixed(1);
    var w=Math.round((d.total/max)*130);
    tb.innerHTML+='<tr><td>'+(i+1)+'</td><td>'+d.country+'</td><td class="num">'+fmtFull(d.total)+'</td><td><div class="bar-cell"><div class="mini-bar" style="width:'+w+'px;background:'+C.green+'"></div><span>'+pct+'%</span></div></td></tr>';
  });
  t.appendChild(tb);
})();

// ── PDF EXPORT ────────────────────────────────────────────────────────────────
document.getElementById('exportPDF').addEventListener('click', function(){
  var btn=document.getElementById('exportPDF');
  var lbl=document.getElementById('exportLabel');
  var ico=document.getElementById('exportIcon');
  btn.classList.add('loading'); lbl.textContent='Building PDF...'; ico.classList.add('spin');

  var jsPDF=window.jspdf.jsPDF;
  var PW=297, PH=210, M=10, CW=PW-M*2;
  var activeTab=document.querySelector('.tab-panel.active');
  var activeBtn=document.querySelector('#nav button.active');
  var tabLabel=activeBtn ? activeBtn.textContent.trim() : 'Dashboard';
  var pdf=new jsPDF({orientation:'landscape',unit:'mm',format:'a4'});

  function drawHdr(p,title,pg){
    p.setFillColor(26,29,39); p.rect(0,0,PW,14,'F');
    p.setTextColor(226,232,240); p.setFontSize(9); p.setFont('helvetica','bold');
    p.text('Humanitarian Arrivals to the U.S.',M,9);
    p.setFont('helvetica','normal'); p.setTextColor(136,146,164);
    p.text(title,PW/2,9,{align:'center'});
    p.text('Page '+pg+' | Source: DHS/OHS Statistics',PW-M,9,{align:'right'});
  }

  var blocks=Array.from(activeTab.querySelectorAll('.kpi-grid,.insight,.explainer-grid,.spotlight,.refugee-share-bar,.chart-card,.filter-row'));
  var pg=1, cy=16;
  drawHdr(pdf,tabLabel,pg);

  function processNext(i){
    if (i>=blocks.length){
      pdf.save('Humanitarian_Dashboard_'+tabLabel.replace(/\s+/g,'_').slice(0,30)+'_FY2022.pdf');
      btn.classList.remove('loading'); lbl.textContent='Export PDF'; ico.classList.remove('spin');
      return;
    }
    var block=blocks[i];
    if (!block.offsetHeight){ processNext(i+1); return; }
    html2canvas(block,{scale:2,useCORS:true,backgroundColor:'#1a1d27',logging:false,windowWidth:1400}).then(function(canvas){
      var imgH=CW*(canvas.height/canvas.width);
      if (cy+imgH>PH-M){ pdf.addPage(); pg++; cy=16; drawHdr(pdf,tabLabel,pg); }
      pdf.addImage(canvas.toDataURL('image/png'),'PNG',M,cy,CW,imgH);
      cy+=imgH+4;
      processNext(i+1);
    }).catch(function(){ processNext(i+1); });
  }
  processNext(0);
});
