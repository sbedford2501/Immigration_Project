(function () {

  /* catch any uncaught errors and show them on screen */
  window.onerror = function(msg, src, line) {
    var b = document.getElementById('_errBanner');
    if (!b) {
      b = document.createElement('div');
      b.id = '_errBanner';
      b.style.cssText = 'position:fixed;bottom:0;left:0;right:0;background:#7f1d1d;color:#fecaca;font-size:12px;padding:8px 14px;z-index:9999;white-space:pre-wrap;max-height:160px;overflow:auto;';
      document.body.appendChild(b);
    }
    b.textContent += 'JS ERROR: ' + msg + ' (line ' + line + ')\n';
    return false;
  };

  var BLU='#4f8ef7', GRN='#34d399', AMB='#f59e0b', RED='#f87171',
      PUR='#a78bfa', ORG='#fb923c', TEA='#2dd4bf';

  function fmt(n){
    if(n>=1e6) return (n/1e6).toFixed(1)+'M';
    if(n>=1e3) return Math.round(n/1e3)+'K';
    return n.toLocaleString();
  }
  function full(n){ return n.toLocaleString(); }
  function alpha(hex,a){
    var r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);
    return 'rgba('+r+','+g+','+b+','+a+')';
  }
  function lineDS(lbl,data,col,fill){
    return {label:lbl,data:data,borderColor:col,
      backgroundColor:fill?alpha(col,0.15):'transparent',
      borderWidth:2,pointRadius:3,pointHoverRadius:5,tension:0.3,fill:!!fill};
  }
  function barDS(lbl,data,col){
    return {label:lbl,data:data,backgroundColor:alpha(col,0.8),
      borderColor:col,borderWidth:1,borderRadius:3};
  }

  var TIP = {
    backgroundColor:'#1a1d27',borderColor:'#2e3350',borderWidth:1,
    titleColor:'#e2e8f0',bodyColor:'#8892a4',padding:10,
    callbacks:{label:function(c){
      return ' '+c.dataset.label+': '+(c.parsed.y!=null?c.parsed.y.toLocaleString():'N/A');
    }}
  };
  var SC = {
    x:{grid:{color:'#2e3350'},ticks:{maxRotation:45}},
    y:{grid:{color:'#2e3350'},ticks:{callback:function(v){return fmt(v);}}}
  };
  var SCst = {
    x:{grid:{color:'#2e3350'},stacked:true},
    y:{grid:{color:'#2e3350'},stacked:true,ticks:{callback:function(v){return fmt(v);}}}
  };
  var BASE = {responsive:true,maintainAspectRatio:false};

  Chart.defaults.color='#8892a4';
  Chart.defaults.borderColor='#2e3350';
  Chart.defaults.font.family="'Segoe UI',system-ui,sans-serif";
  Chart.defaults.font.size=11;

  /* visible error banner */
  function showErr(msg) {
    var b = document.getElementById('_errBanner');
    if (!b) {
      b = document.createElement('div');
      b.id = '_errBanner';
      b.style.cssText = 'position:fixed;bottom:0;left:0;right:0;background:#7f1d1d;color:#fecaca;font-size:12px;padding:8px 14px;z-index:9999;white-space:pre-wrap;max-height:160px;overflow:auto;';
      document.body.appendChild(b);
    }
    b.textContent += msg + '\n';
  }

  /* safe chart maker */
  function mk(id, type, data, options, plugins) {
    var el = document.getElementById(id);
    if (!el) { showErr('MISSING canvas: ' + id); return null; }
    try {
      var cfg = {type:type, data:data, options:options};
      if (plugins) cfg.plugins = plugins;
      return new Chart(el, cfg);
    } catch(e) {
      showErr('CHART ERROR [' + id + ']: ' + e.message);
      return null;
    }
  }

  /* KPI tiles */
  var k = immigrationData.kpi2022;
  document.getElementById('kpi-lpr').textContent = k.lpr.toLocaleString();
  document.getElementById('kpi-nat').textContent = k.naturalizations.toLocaleString();
  document.getElementById('kpi-ref').textContent = k.refugees.toLocaleString();
  document.getElementById('kpi-asy').textContent = k.asylumGranted.toLocaleString();

  /* deferred init — only build charts when tab becomes visible */
  var inited = {};

  function buildTab(id) {
    if (inited[id]) return;
    inited[id] = true;
    if (id==='overview')      buildOverview();
    if (id==='refugees')      buildRefugees();
    if (id==='asylum')        buildAsylum();
    if (id==='lpr')           buildLPR();
    if (id==='naturalization') buildNat();
  }

  document.querySelectorAll('#nav button').forEach(function(btn){
    btn.addEventListener('click', function(){
      document.querySelectorAll('#nav button').forEach(function(b){b.classList.remove('active');});
      document.querySelectorAll('.tab-panel').forEach(function(p){p.classList.remove('active');});
      btn.classList.add('active');
      var tabId = btn.dataset.tab;
      document.getElementById(tabId).classList.add('active');
      buildTab(tabId);
    });
  });

  /* build overview immediately — it is already visible */
  buildTab('overview');

  /* ── OVERVIEW ─────────────────────────────────────────── */
  function buildOverview() {
    var lprD = immigrationData.lprTotal;
    var lprV = lprD.map(function(d){return d.total;});
    var lprMxI = lprV.indexOf(Math.max.apply(null,lprV));
    var lprMnI = lprV.indexOf(Math.min.apply(null,lprV));

    mk('overviewLPR', 'line',
      {labels:lprD.map(function(d){return d.year;}), datasets:[lineDS('Green Cards',lprV,BLU,true)]},
      Object.assign({},BASE,{scales:SC,plugins:{tooltip:TIP,legend:{display:false}}}),
      [{id:'lprHL',afterDatasetsDraw:function(ch){
        var ctx=ch.ctx,x=ch.scales.x,y=ch.scales.y;
        [[lprMxI,lprV[lprMxI],'High'],[lprMnI,lprV[lprMnI],'Low']].forEach(function(it){
          ctx.save();ctx.fillStyle=BLU;ctx.font='bold 10px sans-serif';ctx.textAlign='center';
          ctx.fillText((it[2]==='High'?'High: ':'Low: ')+fmt(it[1]),
            x.getPixelForValue(lprD[it[0]].year),y.getPixelForValue(it[1])+(it[2]==='High'?-8:14));
          ctx.restore();
        });
      }}]
    );

    var natAll = immigrationData.naturalizations.filter(function(d){return d.year>=2000;});
    var natV = natAll.map(function(d){return d.total;});
    var natMxI = natV.indexOf(Math.max.apply(null,natV));
    var natMnI = natV.indexOf(Math.min.apply(null,natV));

    mk('overviewNat', 'bar',
      {labels:natAll.map(function(d){return d.year;}), datasets:[barDS('Naturalizations',natV,GRN)]},
      Object.assign({},BASE,{scales:SC,plugins:{tooltip:TIP,legend:{display:false}}}),
      [{id:'natHL',afterDatasetsDraw:function(ch){
        var ctx=ch.ctx,x=ch.scales.x,y=ch.scales.y;
        [[natMxI,natV[natMxI],'High'],[natMnI,natV[natMnI],'Low']].forEach(function(it){
          ctx.save();ctx.fillStyle=GRN;ctx.font='bold 10px sans-serif';ctx.textAlign='center';
          ctx.fillText((it[2]==='High'?'High: ':'Low: ')+fmt(it[1]),
            x.getPixelForValue(natAll[it[0]].year),y.getPixelForValue(it[1])+(it[2]==='High'?-8:14));
          ctx.restore();
        });
      }}]
    );

    mk('overviewRef', 'line',
      {labels:immigrationData.refugeeArrivals.map(function(d){return d.year;}),
       datasets:[lineDS('Refugee Arrivals',immigrationData.refugeeArrivals.map(function(d){return d.total;}),AMB,true)]},
      Object.assign({},BASE,{scales:SC,plugins:{tooltip:TIP,legend:{labels:{boxWidth:12,padding:16}}}})
    );

    mk('overviewAsy', 'line',
      {labels:immigrationData.asylumGranted.map(function(d){return d.year;}),
       datasets:[
         lineDS('Total',immigrationData.asylumGranted.map(function(d){return d.total;}),RED,true),
         lineDS('Affirmative',immigrationData.asylumGranted.map(function(d){return d.affirmative;}),PUR,false),
         lineDS('Defensive',immigrationData.asylumGranted.map(function(d){return d.defensive;}),ORG,false)
       ]},
      Object.assign({},BASE,{scales:SC,plugins:{tooltip:TIP,legend:{labels:{boxWidth:12,padding:16}}}})
    );
  }

  /* ── REFUGEES ─────────────────────────────────────────── */
  var showDem=false, showRep=false, refChart=null;

  function buildRefugees() {
    var refYrs = immigrationData.refugeeArrivals.map(function(d){return d.year;});
    var refV   = immigrationData.refugeeArrivals.map(function(d){return d.total;});
    var refAvg = Math.round(refV.reduce(function(a,b){return a+b;},0)/refV.length);

    refChart = mk('refTimeline', 'bar',
      {labels:refYrs, datasets:[
        barDS('Refugee Arrivals',refV,AMB),
        {label:'Average ('+fmt(refAvg)+')',
         data:refYrs.map(function(){return refAvg;}),
         type:'line',borderColor:TEA,borderWidth:2,borderDash:[6,4],
         pointRadius:0,fill:false,tension:0}
      ]},
      Object.assign({},BASE,{scales:SC,plugins:{tooltip:TIP,legend:{display:false}}}),
      [{id:'adminShade',beforeDraw:function(ch){
        if(!showDem&&!showRep) return;
        var ctx=ch.ctx,x=ch.scales.x,y=ch.scales.y;
        immigrationData.administrations.forEach(function(adm){
          if(adm.party==='D'&&!showDem) return;
          if(adm.party==='R'&&!showRep) return;
          var si=refYrs.indexOf(adm.start); if(si<0) return;
          var ei=refYrs.indexOf(adm.end); if(ei<0) ei=refYrs.length-1;
          var x1=x.getPixelForValue(refYrs[si]), x2=x.getPixelForValue(refYrs[Math.min(ei,refYrs.length-1)]);
          ctx.save();
          ctx.fillStyle=adm.party==='D'?'rgba(79,142,247,0.13)':'rgba(248,113,113,0.13)';
          ctx.fillRect(x1,y.top,x2-x1,y.bottom-y.top);
          ctx.fillStyle=adm.party==='D'?'rgba(79,142,247,0.8)':'rgba(248,113,113,0.8)';
          ctx.font='9px sans-serif'; ctx.textAlign='center';
          ctx.fillText(adm.name,(x1+x2)/2,y.top+10);
          ctx.restore();
        });
      }}]
    );

    var td=document.getElementById('toggleDem');
    var tr=document.getElementById('toggleRep');
    if(td) td.addEventListener('click',function(){
      showDem=!showDem; this.classList.toggle('dem',showDem);
      if(refChart) refChart.update();
    });
    if(tr) tr.addEventListener('click',function(){
      showRep=!showRep; this.classList.toggle('rep',showRep);
      if(refChart) refChart.update();
    });

    var rr = immigrationData.refugeeByRegion;
    mk('refRegion', 'bar',
      {labels:rr.years, datasets:[
        barDS('Africa',rr.Africa,AMB), barDS('Asia',rr.Asia,BLU),
        barDS('Europe',rr.Europe,PUR), barDS('North America',rr.NorthAmerica,GRN),
        barDS('South America',rr.SouthAmerica,ORG)
      ]},
      Object.assign({},BASE,{scales:SCst,plugins:{tooltip:TIP,legend:{labels:{boxWidth:12,padding:16}}}})
    );

    var rn = immigrationData.refugeeTopNationalities2022;
    mk('refNat', 'bar',
      {labels:rn.map(function(d){return d.country;}),
       datasets:[barDS('Arrivals',rn.map(function(d){return d.arrivals;}),AMB)]},
      Object.assign({},BASE,{indexAxis:'y',
        scales:{x:{grid:{color:'#2e3350'},ticks:{callback:function(v){return fmt(v);}}},y:{grid:{color:'#2e3350'}}},
        plugins:{tooltip:TIP,legend:{display:false}}})
    );

    var mx=Math.max.apply(null,rn.map(function(d){return d.arrivals;}));
    var h='<thead><tr><th>#</th><th>Country</th><th class="num">Arrivals</th><th>Share</th></tr></thead><tbody>';
    rn.forEach(function(d,i){
      var pct=((d.arrivals/25519)*100).toFixed(1);
      var w=Math.round((d.arrivals/mx)*120);
      h+='<tr><td>'+(i+1)+'</td><td>'+d.country+'</td><td class="num">'+full(d.arrivals)+'</td>'
        +'<td><div class="bc"><div class="mb" style="width:'+w+'px;background:'+AMB+'"></div><span>'+pct+'%</span></div></td></tr>';
    });
    var t=document.getElementById('refTable'); if(t) t.innerHTML=h+'</tbody>';
  }

  /* ── ASYLUM ───────────────────────────────────────────── */
  function buildAsylum() {
    var asyD = immigrationData.asylumGranted;
    var asyN = immigrationData.asylumTopNationalities2022;

    var af = document.getElementById('asyCountryFilter');
    if(af){
      asyN.slice().sort(function(a,b){return a.country.localeCompare(b.country);}).forEach(function(d){
        var o=document.createElement('option'); o.value=d.country; o.textContent=d.country;
        af.appendChild(o);
      });
    }

    mk('asyTimeline', 'line',
      {labels:asyD.map(function(d){return d.year;}), datasets:[
        {label:'Affirmative',data:asyD.map(function(d){return d.affirmative;}),
         borderColor:PUR,backgroundColor:alpha(PUR,0.3),borderWidth:2,pointRadius:3,tension:0.3,fill:true},
        {label:'Defensive',data:asyD.map(function(d){return d.defensive;}),
         borderColor:ORG,backgroundColor:alpha(ORG,0.3),borderWidth:2,pointRadius:3,tension:0.3,fill:true}
      ]},
      Object.assign({},BASE,{scales:SC,plugins:{tooltip:TIP,legend:{labels:{boxWidth:12,padding:16}}}})
    );

    var asyNatChart = mk('asyNat', 'bar',
      {labels:asyN.map(function(d){return d.country;}),
       datasets:[barDS('Affirmative Grants',asyN.map(function(d){return d.granted;}),PUR)]},
      Object.assign({},BASE,{indexAxis:'y',
        scales:{x:{grid:{color:'#2e3350'},ticks:{callback:function(v){return fmt(v);}}},y:{grid:{color:'#2e3350'}}},
        plugins:{tooltip:TIP,legend:{display:false}}})
    );

    mk('asyPie', 'doughnut',
      {labels:['Affirmative (USCIS)','Defensive (Courts)'],
       datasets:[{data:[14134,22481],
         backgroundColor:[alpha(PUR,0.8),alpha(ORG,0.8)],
         borderColor:[PUR,ORG],borderWidth:2}]},
      {responsive:true,maintainAspectRatio:false,
       plugins:{
         tooltip:{backgroundColor:'#1a1d27',borderColor:'#2e3350',borderWidth:1,
           titleColor:'#e2e8f0',bodyColor:'#8892a4',padding:10,
           callbacks:{label:function(c){return ' '+c.label+': '+c.parsed.toLocaleString();}}},
         legend:{position:'bottom',labels:{boxWidth:12,padding:16}}
       }}
    );

    if(af) af.addEventListener('change',function(){
      var val=this.value, note=document.getElementById('asyFilterNote');
      var filtered = val==='all' ? asyN : asyN.filter(function(d){return d.country===val;});
      if(note) note.textContent = val==='all' ? '' : (filtered.length ? val+' — '+filtered[0].granted.toLocaleString()+' grants FY2022' : 'Not in top 10');
      if(asyNatChart){
        asyNatChart.data.labels = filtered.map(function(d){return d.country;});
        asyNatChart.data.datasets[0].data = filtered.map(function(d){return d.granted;});
        asyNatChart.update();
      }
    });

    var rows=asyD.slice().reverse();
    var h='<thead><tr><th>Year</th><th class="num">Total</th><th class="num">Affirmative</th><th class="num">Defensive</th><th>Aff. Share</th></tr></thead><tbody>';
    rows.forEach(function(d){
      var pct=((d.affirmative/d.total)*100).toFixed(1);
      var w=Math.round((d.affirmative/d.total)*80);
      h+='<tr><td>'+d.year+'</td><td class="num">'+full(d.total)+'</td><td class="num">'+full(d.affirmative)+'</td><td class="num">'+full(d.defensive)+'</td>'
        +'<td><div class="bc"><div class="mb" style="width:'+w+'px;background:'+PUR+'"></div><span>'+pct+'%</span></div></td></tr>';
    });
    var t=document.getElementById('asyTable'); if(t) t.innerHTML=h+'</tbody>';
  }

  /* ── LPR ──────────────────────────────────────────────── */
  function buildLPR() {
    mk('lprTimeline', 'line',
      {labels:immigrationData.lprTotal.map(function(d){return d.year;}),
       datasets:[lineDS('Green Cards',immigrationData.lprTotal.map(function(d){return d.total;}),BLU,true)]},
      Object.assign({},BASE,{scales:SC,plugins:{tooltip:TIP,legend:{display:false}}})
    );

    var lc=immigrationData.lprByClass;
    mk('lprClass', 'bar',
      {labels:lc.years, datasets:[
        barDS('Immediate Relatives',lc.immediateRelatives,BLU),
        barDS('Family Sponsored',lc.familySponsored,GRN),
        barDS('Employment Based',lc.employmentBased,AMB),
        barDS('Diversity',lc.diversity,PUR),
        barDS('Refugees/Asylees',lc.refugeesAsylees,RED)
      ]},
      Object.assign({},BASE,{scales:SCst,plugins:{tooltip:TIP,legend:{labels:{boxWidth:12,padding:16}}}})
    );

    var lr=immigrationData.lprByRegion;
    mk('lprRegion', 'line',
      {labels:lr.years, datasets:[
        lineDS('Africa',lr.Africa,AMB,false), lineDS('Asia',lr.Asia,BLU,false),
        lineDS('Europe',lr.Europe,PUR,false), lineDS('North America',lr.NorthAmerica,GRN,false),
        lineDS('South America',lr.SouthAmerica,ORG,false)
      ]},
      Object.assign({},BASE,{scales:SC,plugins:{tooltip:TIP,legend:{labels:{boxWidth:12,padding:16}}}})
    );

    var lc2=immigrationData.lprTopCountries2022;
    mk('lprCountry', 'bar',
      {labels:lc2.map(function(d){return d.country;}),
       datasets:[barDS('LPR Admissions',lc2.map(function(d){return d.total;}),BLU)]},
      Object.assign({},BASE,{indexAxis:'y',
        scales:{x:{grid:{color:'#2e3350'},ticks:{callback:function(v){return fmt(v);}}},y:{grid:{color:'#2e3350'}}},
        plugins:{tooltip:TIP,legend:{display:false}}})
    );

    var data=immigrationData.lprByState2022.slice().sort(function(a,b){return b.total-a.total;});
    var mx=data[0].total;
    var h='<thead><tr><th>#</th><th>State</th><th class="num">LPR Admissions</th><th>Share</th></tr></thead><tbody>';
    data.forEach(function(d,i){
      var pct=((d.total/1018349)*100).toFixed(1);
      var w=Math.round((d.total/mx)*140);
      h+='<tr><td>'+(i+1)+'</td><td>'+d.state+'</td><td class="num">'+full(d.total)+'</td>'
        +'<td><div class="bc"><div class="mb" style="width:'+w+'px;background:'+BLU+'"></div><span>'+pct+'%</span></div></td></tr>';
    });
    var t=document.getElementById('lprStateTable'); if(t) t.innerHTML=h+'</tbody>';
  }

  /* ── NATURALIZATIONS ──────────────────────────────────── */
  function buildNat() {
    var natYrs=immigrationData.naturalizations.map(function(d){return d.year;});
    var refByYr={};
    immigrationData.refugeeArrivals.forEach(function(d){refByYr[d.year]=d.total;});
    var refElig=natYrs.map(function(yr){return refByYr[yr-6]||null;});

    mk('natTimeline', 'line',
      {labels:natYrs, datasets:[
        {label:'Persons who Received Citizenship',
         data:immigrationData.naturalizations.map(function(d){return d.total;}),
         borderColor:GRN,backgroundColor:alpha(GRN,0.15),borderWidth:2,pointRadius:3,tension:0.3,fill:true},
        {label:'Refugees eligible for citizenship (arrived ~6 yrs prior)',
         data:refElig,borderColor:AMB,backgroundColor:'transparent',
         borderWidth:2,borderDash:[6,4],pointRadius:4,pointBackgroundColor:AMB,tension:0.3,fill:false}
      ]},
      Object.assign({},BASE,{scales:SC,plugins:{
        tooltip:{backgroundColor:'#1a1d27',borderColor:'#2e3350',borderWidth:1,
          titleColor:'#e2e8f0',bodyColor:'#8892a4',padding:10,
          callbacks:{label:function(c){return ' '+c.dataset.label+': '+(c.parsed.y!=null?c.parsed.y.toLocaleString():'N/A');}}},
        legend:{display:true,labels:{boxWidth:14,padding:14,
          generateLabels:function(ch){
            return ch.data.datasets.map(function(ds,i){
              return {text:ds.label,fillStyle:ds.borderColor,strokeStyle:ds.borderColor,
                lineWidth:2,lineDash:ds.borderDash||[],hidden:false,datasetIndex:i};
            });
          }
        }}
      }})
    );

    var nr=immigrationData.naturalizationsByRegion;
    mk('natRegion', 'bar',
      {labels:nr.years, datasets:[
        barDS('Africa',nr.Africa,AMB), barDS('Asia',nr.Asia,BLU),
        barDS('Europe',nr.Europe,PUR), barDS('North America',nr.NorthAmerica,GRN),
        barDS('South America',nr.SouthAmerica,ORG)
      ]},
      Object.assign({},BASE,{scales:SCst,plugins:{tooltip:TIP,legend:{labels:{boxWidth:12,padding:16}}}})
    );

    var nc=immigrationData.naturalizationTopCountries2022;
    mk('natCountry', 'bar',
      {labels:nc.map(function(d){return d.country;}),
       datasets:[barDS('Naturalizations',nc.map(function(d){return d.total;}),GRN)]},
      Object.assign({},BASE,{indexAxis:'y',
        scales:{x:{grid:{color:'#2e3350'},ticks:{callback:function(v){return fmt(v);}}},y:{grid:{color:'#2e3350'}}},
        plugins:{tooltip:TIP,legend:{display:false}}})
    );

    var data=nc.slice().sort(function(a,b){return b.total-a.total;});
    var mx=data[0].total;
    var h='<thead><tr><th>#</th><th>Country</th><th class="num">Naturalizations</th><th>Share</th></tr></thead><tbody>';
    data.forEach(function(d,i){
      var pct=((d.total/969380)*100).toFixed(1);
      var w=Math.round((d.total/mx)*130);
      h+='<tr><td>'+(i+1)+'</td><td>'+d.country+'</td><td class="num">'+full(d.total)+'</td>'
        +'<td><div class="bc"><div class="mb" style="width:'+w+'px;background:'+GRN+'"></div><span>'+pct+'%</span></div></td></tr>';
    });
    var t=document.getElementById('natTable'); if(t) t.innerHTML=h+'</tbody>';
  }

  /* ── PDF EXPORT ───────────────────────────────────────── */
  var expBtn=document.getElementById('exportPDF');
  if(expBtn) expBtn.addEventListener('click',function(){
    var lbl=document.getElementById('exportLabel');
    var ico=document.getElementById('exportIcon');
    expBtn.classList.add('loading');
    if(lbl) lbl.textContent='Building PDF...';
    if(ico) ico.classList.add('spin');
    try{
      var jsPDF=window.jspdf.jsPDF;
      var PW=297,PH=210,M=10,CW=PW-M*2;
      var activeTab=document.querySelector('.tab-panel.active');
      var activeBtn=document.querySelector('#nav button.active');
      var tabLabel=activeBtn?activeBtn.textContent.trim():'Dashboard';
      var pdf=new jsPDF({orientation:'landscape',unit:'mm',format:'a4'});
      function hdr(p,title,pg){
        p.setFillColor(26,29,39);p.rect(0,0,PW,14,'F');
        p.setTextColor(226,232,240);p.setFontSize(9);p.setFont('helvetica','bold');
        p.text('Humanitarian Arrivals to the U.S.',M,9);
        p.setFont('helvetica','normal');p.setTextColor(136,146,164);
        p.text(title,PW/2,9,{align:'center'});
        p.text('Page '+pg+' | DHS/OHS Statistics',PW-M,9,{align:'right'});
      }
      var blocks=Array.from(activeTab.querySelectorAll('.kgrid,.ins,.expgrid,.spot,.rfbar,.ccard,.frow'));
      var pg=1,cy=16; hdr(pdf,tabLabel,pg);
      function next(i){
        if(i>=blocks.length){
          pdf.save('Dashboard_'+tabLabel.replace(/\s+/g,'_').slice(0,30)+'.pdf');
          expBtn.classList.remove('loading');
          if(lbl) lbl.textContent='Export PDF';
          if(ico) ico.classList.remove('spin');
          return;
        }
        var bl=blocks[i];
        if(!bl.offsetHeight){next(i+1);return;}
        html2canvas(bl,{scale:2,useCORS:true,backgroundColor:'#1a1d27',logging:false,windowWidth:1400})
          .then(function(cv){
            var ih=CW*(cv.height/cv.width);
            if(cy+ih>PH-M){pdf.addPage();pg++;cy=16;hdr(pdf,tabLabel,pg);}
            pdf.addImage(cv.toDataURL('image/png'),'PNG',M,cy,CW,ih);
            cy+=ih+4; next(i+1);
          }).catch(function(){next(i+1);});
      }
      next(0);
    }catch(e){
      console.error('PDF error',e);
      expBtn.classList.remove('loading');
      if(lbl) lbl.textContent='Export PDF';
      if(ico) ico.classList.remove('spin');
    }
  });

}());
