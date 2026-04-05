/* charts.js — Humanitarian Arrivals Dashboard */
(function () {
  'use strict';

  /* ── palette ── */
  var BLU='#4f8ef7', GRN='#34d399', AMB='#f59e0b', RED='#f87171',
      PUR='#a78bfa', ORG='#fb923c', TEA='#2dd4bf';

  /* ── helpers ── */
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
  function line(lbl,data,col,fill){
    return {label:lbl,data:data,borderColor:col,
      backgroundColor:fill?alpha(col,0.15):'transparent',
      borderWidth:2,pointRadius:3,pointHoverRadius:5,tension:0.3,fill:!!fill};
  }
  function bar(lbl,data,col){
    return {label:lbl,data:data,backgroundColor:alpha(col,0.8),
      borderColor:col,borderWidth:1,borderRadius:3};
  }

  /* ── shared chart options ── */
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
  var OPTS  = {responsive:true,maintainAspectRatio:false,scales:SC,  plugins:{tooltip:TIP,legend:{labels:{boxWidth:12,padding:16}}}};
  var OPTSst= {responsive:true,maintainAspectRatio:false,scales:SCst,plugins:{tooltip:TIP,legend:{labels:{boxWidth:12,padding:16}}}};
  var OPTSnl= {responsive:true,maintainAspectRatio:false,scales:SC,  plugins:{tooltip:TIP,legend:{display:false}}};

  /* ── safe chart factory — never throws ── */
  function mkChart(id,cfg,plugins){
    try{
      var el=document.getElementById(id);
      if(!el){console.warn('canvas not found:',id);return null;}
      return new Chart(el,Object.assign({},cfg,plugins?{plugins:plugins}:{}));
    }catch(e){console.error('chart error ['+id+']:',e);return null;}
  }

  /* ── Chart.js defaults ── */
  Chart.defaults.color='#8892a4';
  Chart.defaults.borderColor='#2e3350';
  Chart.defaults.font.family="'Segoe UI',system-ui,sans-serif";
  Chart.defaults.font.size=11;

  /* ── tab navigation ── */
  document.querySelectorAll('#nav button').forEach(function(btn){
    btn.addEventListener('click',function(){
      document.querySelectorAll('#nav button').forEach(function(b){b.classList.remove('active');});
      document.querySelectorAll('.tab-panel').forEach(function(p){p.classList.remove('active');});
      btn.classList.add('active');
      document.getElementById(btn.dataset.tab).classList.add('active');
    });
  });

  /* ── KPI tiles ── */
  var k=immigrationData.kpi2022;
  document.getElementById('kpi-lpr').textContent=k.lpr.toLocaleString();
  document.getElementById('kpi-nat').textContent=k.naturalizations.toLocaleString();
  document.getElementById('kpi-ref').textContent=k.refugees.toLocaleString();
  document.getElementById('kpi-asy').textContent=k.asylumGranted.toLocaleString();

  /* ════════════════════════════════════════════
     OVERVIEW
  ════════════════════════════════════════════ */
  var lprD=immigrationData.lprTotal;
  var lprVals=lprD.map(function(d){return d.total;});
  var lprMax=Math.max.apply(null,lprVals), lprMin=Math.min.apply(null,lprVals);
  var lprMaxI=lprVals.indexOf(lprMax), lprMinI=lprVals.indexOf(lprMin);

  mkChart('overviewLPR',{
    type:'line',
    data:{labels:lprD.map(function(d){return d.year;}),datasets:[line('Green Cards',lprVals,BLU,true)]},
    options:OPTSnl
  },[{id:'lprHL',afterDatasetsDraw:function(ch){
    var ctx=ch.ctx,x=ch.scales.x,y=ch.scales.y;
    [[lprMaxI,lprMax,'High'],[lprMinI,lprMin,'Low']].forEach(function(it){
      ctx.save();ctx.fillStyle=BLU;ctx.font='bold 10px sans-serif';ctx.textAlign='center';
      ctx.fillText((it[2]==='High'?'High: ':'Low: ')+fmt(it[1]),
        x.getPixelForIndex(it[0]),y.getPixelForValue(it[1])+(it[2]==='High'?-8:14));
      ctx.restore();
    });
  }}]);

  var natAll=immigrationData.naturalizations.filter(function(d){return d.year>=2000;});
  var natVals=natAll.map(function(d){return d.total;});
  var natMax=Math.max.apply(null,natVals), natMin=Math.min.apply(null,natVals);
  var natMaxI=natVals.indexOf(natMax), natMinI=natVals.indexOf(natMin);

  mkChart('overviewNat',{
    type:'bar',
    data:{labels:natAll.map(function(d){return d.year;}),datasets:[bar('Naturalizations',natVals,GRN)]},
    options:OPTSnl
  },[{id:'natHL',afterDatasetsDraw:function(ch){
    var ctx=ch.ctx,x=ch.scales.x,y=ch.scales.y;
    [[natMaxI,natMax,'High'],[natMinI,natMin,'Low']].forEach(function(it){
      ctx.save();ctx.fillStyle=GRN;ctx.font='bold 10px sans-serif';ctx.textAlign='center';
      ctx.fillText((it[2]==='High'?'High: ':'Low: ')+fmt(it[1]),
        x.getPixelForIndex(it[0]),y.getPixelForValue(it[1])+(it[2]==='High'?-8:14));
      ctx.restore();
    });
  }}]);

  mkChart('overviewRef',{
    type:'line',
    data:{labels:immigrationData.refugeeArrivals.map(function(d){return d.year;}),
      datasets:[line('Refugee Arrivals',immigrationData.refugeeArrivals.map(function(d){return d.total;}),AMB,true)]},
    options:OPTS
  });

  mkChart('overviewAsy',{
    type:'line',
    data:{labels:immigrationData.asylumGranted.map(function(d){return d.year;}),
      datasets:[
        line('Total',immigrationData.asylumGranted.map(function(d){return d.total;}),RED,true),
        line('Affirmative',immigrationData.asylumGranted.map(function(d){return d.affirmative;}),PUR,false),
        line('Defensive',immigrationData.asylumGranted.map(function(d){return d.defensive;}),ORG,false)
      ]},
    options:OPTS
  });

  /* ════════════════════════════════════════════
     REFUGEES
  ════════════════════════════════════════════ */
  var refYears=immigrationData.refugeeArrivals.map(function(d){return d.year;});
  var refVals=immigrationData.refugeeArrivals.map(function(d){return d.total;});
  var refAvg=Math.round(refVals.reduce(function(a,b){return a+b;},0)/refVals.length);
  var showDem=false, showRep=false;

  var refChart=mkChart('refTimeline',{
    type:'bar',
    data:{labels:refYears,datasets:[
      bar('Refugee Arrivals',refVals,AMB),
      {label:'Average ('+fmt(refAvg)+')',data:refYears.map(function(){return refAvg;}),
        type:'line',borderColor:TEA,borderWidth:2,borderDash:[6,4],pointRadius:0,fill:false,tension:0}
    ]},
    options:{responsive:true,maintainAspectRatio:false,scales:SC,
      plugins:{tooltip:TIP,legend:{display:false}}}
  },[{id:'adminShade',beforeDraw:function(ch){
    if(!showDem&&!showRep)return;
    var ctx=ch.ctx,x=ch.scales.x,y=ch.scales.y;
    immigrationData.administrations.forEach(function(adm){
      if(adm.party==='D'&&!showDem)return;
      if(adm.party==='R'&&!showRep)return;
      var si=refYears.indexOf(adm.start);
      if(si<0)return;
      var ei=refYears.indexOf(adm.end);
      if(ei<0)ei=refYears.length-1;
      var x1=x.getPixelForIndex(si), x2=x.getPixelForIndex(Math.min(ei,refYears.length-1));
      ctx.save();
      ctx.fillStyle=adm.party==='D'?'rgba(79,142,247,0.13)':'rgba(248,113,113,0.13)';
      ctx.fillRect(x1,y.top,x2-x1,y.bottom-y.top);
      ctx.fillStyle=adm.party==='D'?'rgba(79,142,247,0.8)':'rgba(248,113,113,0.8)';
      ctx.font='9px sans-serif';ctx.textAlign='center';
      ctx.fillText(adm.name,(x1+x2)/2,y.top+10);
      ctx.restore();
    });
  }}]);

  var togDem=document.getElementById('toggleDem');
  var togRep=document.getElementById('toggleRep');
  if(togDem) togDem.addEventListener('click',function(){
    showDem=!showDem;this.classList.toggle('active-dem',showDem);
    if(refChart)refChart.update();
  });
  if(togRep) togRep.addEventListener('click',function(){
    showRep=!showRep;this.classList.toggle('active-rep',showRep);
    if(refChart)refChart.update();
  });

  var rr=immigrationData.refugeeByRegion;
  mkChart('refRegion',{
    type:'bar',
    data:{labels:rr.years,datasets:[
      bar('Africa',rr.Africa,AMB),bar('Asia',rr.Asia,BLU),
      bar('Europe',rr.Europe,PUR),bar('North America',rr.NorthAmerica,GRN),
      bar('South America',rr.SouthAmerica,ORG)
    ]},
    options:OPTSst
  });

  var rn=immigrationData.refugeeTopNationalities2022;
  mkChart('refNat',{
    type:'bar',
    data:{labels:rn.map(function(d){return d.country;}),
      datasets:[bar('Arrivals',rn.map(function(d){return d.arrivals;}),AMB)]},
    options:{responsive:true,maintainAspectRatio:false,indexAxis:'y',
      scales:{x:{grid:{color:'#2e3350'},ticks:{callback:function(v){return fmt(v);}}},y:{grid:{color:'#2e3350'}}},
      plugins:{tooltip:TIP,legend:{display:false}}}
  });

  (function(){
    var t=document.getElementById('refTable');
    if(!t)return;
    var mx=Math.max.apply(null,rn.map(function(d){return d.arrivals;}));
    var h='<thead><tr><th>#</th><th>Country</th><th class="num">Arrivals</th><th>Share</th></tr></thead><tbody>';
    rn.forEach(function(d,i){
      var pct=((d.arrivals/25519)*100).toFixed(1);
      var w=Math.round((d.arrivals/mx)*120);
      h+='<tr><td>'+(i+1)+'</td><td>'+d.country+'</td><td class="num">'+full(d.arrivals)+'</td>'
        +'<td><div class="bar-cell"><div class="mini-bar" style="width:'+w+'px;background:'+AMB+'"></div><span>'+pct+'%</span></div></td></tr>';
    });
    t.innerHTML=h+'</tbody>';
  }());

  /* ════════════════════════════════════════════
     ASYLUM
  ════════════════════════════════════════════ */
  var asyD=immigrationData.asylumGranted;
  var asyN=immigrationData.asylumTopNationalities2022;

  var asyFilter=document.getElementById('asyCountryFilter');
  if(asyFilter){
    asyN.slice().sort(function(a,b){return a.country.localeCompare(b.country);}).forEach(function(d){
      var o=document.createElement('option');o.value=d.country;o.textContent=d.country;
      asyFilter.appendChild(o);
    });
  }

  mkChart('asyTimeline',{
    type:'line',
    data:{labels:asyD.map(function(d){return d.year;}),datasets:[
      {label:'Affirmative',data:asyD.map(function(d){return d.affirmative;}),
        borderColor:PUR,backgroundColor:alpha(PUR,0.3),borderWidth:2,pointRadius:3,tension:0.3,fill:true},
      {label:'Defensive',data:asyD.map(function(d){return d.defensive;}),
        borderColor:ORG,backgroundColor:alpha(ORG,0.3),borderWidth:2,pointRadius:3,tension:0.3,fill:true}
    ]},
    options:OPTS
  });

  var asyNatChart=mkChart('asyNat',{
    type:'bar',
    data:{labels:asyN.map(function(d){return d.country;}),
      datasets:[bar('Affirmative Grants',asyN.map(function(d){return d.granted;}),PUR)]},
    options:{responsive:true,maintainAspectRatio:false,indexAxis:'y',
      scales:{x:{grid:{color:'#2e3350'},ticks:{callback:function(v){return fmt(v);}}},y:{grid:{color:'#2e3350'}}},
      plugins:{tooltip:TIP,legend:{display:false}}}
  });

  mkChart('asyPie',{
    type:'doughnut',
    data:{labels:['Affirmative (USCIS)','Defensive (Courts)'],
      datasets:[{data:[14134,22481],backgroundColor:[alpha(PUR,0.8),alpha(ORG,0.8)],
        borderColor:[PUR,ORG],borderWidth:2}]},
    options:{responsive:true,maintainAspectRatio:false,
      plugins:{tooltip:{backgroundColor:'#1a1d27',borderColor:'#2e3350',borderWidth:1,
        titleColor:'#e2e8f0',bodyColor:'#8892a4',padding:10,
        callbacks:{label:function(c){return ' '+c.label+': '+c.parsed.toLocaleString();}}},
        legend:{position:'bottom',labels:{boxWidth:12,padding:16}}}}
  });

  if(asyFilter) asyFilter.addEventListener('change',function(){
    var val=this.value, note=document.getElementById('asyFilterNote');
    var filtered=val==='all'?asyN:asyN.filter(function(d){return d.country===val;});
    if(note) note.textContent=val==='all'?'':(filtered.length?val+' — '+filtered[0].granted.toLocaleString()+' grants FY2022':'Not in top 10');
    if(asyNatChart){
      asyNatChart.data.labels=filtered.map(function(d){return d.country;});
      asyNatChart.data.datasets[0].data=filtered.map(function(d){return d.granted;});
      asyNatChart.update();
    }
  });

  (function(){
    var t=document.getElementById('asyTable');
    if(!t)return;
    var rows=asyD.slice().reverse();
    var h='<thead><tr><th>Year</th><th class="num">Total</th><th class="num">Affirmative</th><th class="num">Defensive</th><th>Aff. Share</th></tr></thead><tbody>';
    rows.forEach(function(d){
      var pct=((d.affirmative/d.total)*100).toFixed(1);
      var w=Math.round((d.affirmative/d.total)*80);
      h+='<tr><td>'+d.year+'</td><td class="num">'+full(d.total)+'</td><td class="num">'+full(d.affirmative)+'</td><td class="num">'+full(d.defensive)+'</td>'
        +'<td><div class="bar-cell"><div class="mini-bar" style="width:'+w+'px;background:'+PUR+'"></div><span>'+pct+'%</span></div></td></tr>';
    });
    t.innerHTML=h+'</tbody>';
  }());

  /* ════════════════════════════════════════════
     LPR
  ════════════════════════════════════════════ */
  mkChart('lprTimeline',{
    type:'line',
    data:{labels:immigrationData.lprTotal.map(function(d){return d.year;}),
      datasets:[line('Green Cards',immigrationData.lprTotal.map(function(d){return d.total;}),BLU,true)]},
    options:OPTSnl
  });

  var lc=immigrationData.lprByClass;
  mkChart('lprClass',{
    type:'bar',
    data:{labels:lc.years,datasets:[
      bar('Immediate Relatives',lc.immediateRelatives,BLU),
      bar('Family Sponsored',lc.familySponsored,GRN),
      bar('Employment Based',lc.employmentBased,AMB),
      bar('Diversity',lc.diversity,PUR),
      bar('Refugees/Asylees',lc.refugeesAsylees,RED)
    ]},
    options:OPTSst
  });

  var lr=immigrationData.lprByRegion;
  mkChart('lprRegion',{
    type:'line',
    data:{labels:lr.years,datasets:[
      line('Africa',lr.Africa,AMB,false),line('Asia',lr.Asia,BLU,false),
      line('Europe',lr.Europe,PUR,false),line('North America',lr.NorthAmerica,GRN,false),
      line('South America',lr.SouthAmerica,ORG,false)
    ]},
    options:OPTS
  });

  var lc2=immigrationData.lprTopCountries2022;
  mkChart('lprCountry',{
    type:'bar',
    data:{labels:lc2.map(function(d){return d.country;}),
      datasets:[bar('LPR Admissions',lc2.map(function(d){return d.total;}),BLU)]},
    options:{responsive:true,maintainAspectRatio:false,indexAxis:'y',
      scales:{x:{grid:{color:'#2e3350'},ticks:{callback:function(v){return fmt(v);}}},y:{grid:{color:'#2e3350'}}},
      plugins:{tooltip:TIP,legend:{display:false}}}
  });

  (function(){
    var t=document.getElementById('lprStateTable');
    if(!t)return;
    var data=immigrationData.lprByState2022.slice().sort(function(a,b){return b.total-a.total;});
    var mx=data[0].total;
    var h='<thead><tr><th>#</th><th>State</th><th class="num">LPR Admissions</th><th>Share</th></tr></thead><tbody>';
    data.forEach(function(d,i){
      var pct=((d.total/1018349)*100).toFixed(1);
      var w=Math.round((d.total/mx)*140);
      h+='<tr><td>'+(i+1)+'</td><td>'+d.state+'</td><td class="num">'+full(d.total)+'</td>'
        +'<td><div class="bar-cell"><div class="mini-bar" style="width:'+w+'px;background:'+BLU+'"></div><span>'+pct+'%</span></div></td></tr>';
    });
    t.innerHTML=h+'</tbody>';
  }());

  /* ════════════════════════════════════════════
     NATURALIZATIONS
  ════════════════════════════════════════════ */
  var natYrs=immigrationData.naturalizations.map(function(d){return d.year;});
  var refByYr={};
  immigrationData.refugeeArrivals.forEach(function(d){refByYr[d.year]=d.total;});
  var refElig=natYrs.map(function(yr){return refByYr[yr-6]||null;});

  mkChart('natTimeline',{
    type:'line',
    data:{labels:natYrs,datasets:[
      {label:'Persons who Received Citizenship',
        data:immigrationData.naturalizations.map(function(d){return d.total;}),
        borderColor:GRN,backgroundColor:alpha(GRN,0.15),borderWidth:2,pointRadius:3,tension:0.3,fill:true},
      {label:'Refugees eligible for citizenship (arrived ~6 yrs prior)',
        data:refElig,borderColor:AMB,backgroundColor:'transparent',
        borderWidth:2,borderDash:[6,4],pointRadius:4,pointBackgroundColor:AMB,tension:0.3,fill:false}
    ]},
    options:{responsive:true,maintainAspectRatio:false,scales:SC,
      plugins:{tooltip:{backgroundColor:'#1a1d27',borderColor:'#2e3350',borderWidth:1,
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
      }}
  });

  var nr=immigrationData.naturalizationsByRegion;
  mkChart('natRegion',{
    type:'bar',
    data:{labels:nr.years,datasets:[
      bar('Africa',nr.Africa,AMB),bar('Asia',nr.Asia,BLU),
      bar('Europe',nr.Europe,PUR),bar('North America',nr.NorthAmerica,GRN),
      bar('South America',nr.SouthAmerica,ORG)
    ]},
    options:OPTSst
  });

  var nc=immigrationData.naturalizationTopCountries2022;
  mkChart('natCountry',{
    type:'bar',
    data:{labels:nc.map(function(d){return d.country;}),
      datasets:[bar('Naturalizations',nc.map(function(d){return d.total;}),GRN)]},
    options:{responsive:true,maintainAspectRatio:false,indexAxis:'y',
      scales:{x:{grid:{color:'#2e3350'},ticks:{callback:function(v){return fmt(v);}}},y:{grid:{color:'#2e3350'}}},
      plugins:{tooltip:TIP,legend:{display:false}}}
  });

  (function(){
    var t=document.getElementById('natTable');
    if(!t)return;
    var data=nc.slice().sort(function(a,b){return b.total-a.total;});
    var mx=data[0].total;
    var h='<thead><tr><th>#</th><th>Country</th><th class="num">Naturalizations</th><th>Share</th></tr></thead><tbody>';
    data.forEach(function(d,i){
      var pct=((d.total/969380)*100).toFixed(1);
      var w=Math.round((d.total/mx)*130);
      h+='<tr><td>'+(i+1)+'</td><td>'+d.country+'</td><td class="num">'+full(d.total)+'</td>'
        +'<td><div class="bar-cell"><div class="mini-bar" style="width:'+w+'px;background:'+GRN+'"></div><span>'+pct+'%</span></div></td></tr>';
    });
    t.innerHTML=h+'</tbody>';
  }());

  /* ════════════════════════════════════════════
     PDF EXPORT
  ════════════════════════════════════════════ */
  var expBtn=document.getElementById('exportPDF');
  if(expBtn) expBtn.addEventListener('click',function(){
    var lbl=document.getElementById('exportLabel');
    var ico=document.getElementById('exportIcon');
    expBtn.classList.add('loading');
    if(lbl)lbl.textContent='Building PDF...';
    if(ico)ico.classList.add('spin');

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

      var blocks=Array.from(activeTab.querySelectorAll('.kpi-grid,.insight,.explainer-grid,.spotlight,.refugee-share-bar,.chart-card,.filter-row'));
      var pg=1,cy=16;
      hdr(pdf,tabLabel,pg);

      function next(i){
        if(i>=blocks.length){
          pdf.save('Dashboard_'+tabLabel.replace(/\s+/g,'_').slice(0,30)+'.pdf');
          expBtn.classList.remove('loading');
          if(lbl)lbl.textContent='Export PDF';
          if(ico)ico.classList.remove('spin');
          return;
        }
        var bl=blocks[i];
        if(!bl.offsetHeight){next(i+1);return;}
        html2canvas(bl,{scale:2,useCORS:true,backgroundColor:'#1a1d27',logging:false,windowWidth:1400})
          .then(function(cv){
            var ih=CW*(cv.height/cv.width);
            if(cy+ih>PH-M){pdf.addPage();pg++;cy=16;hdr(pdf,tabLabel,pg);}
            pdf.addImage(cv.toDataURL('image/png'),'PNG',M,cy,CW,ih);
            cy+=ih+4;next(i+1);
          }).catch(function(){next(i+1);});
      }
      next(0);
    }catch(e){
      console.error('PDF error',e);
      expBtn.classList.remove('loading');
      if(lbl)lbl.textContent='Export PDF';
      if(ico)ico.classList.remove('spin');
    }
  });

}());
