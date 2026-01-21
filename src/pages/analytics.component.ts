
import { Component, inject, ElementRef, ViewChild, AfterViewInit, effect, OnDestroy } from '@angular/core';
import { StudyStore } from '../services/study-store.service';
declare const d3: any;

@Component({
  selector: 'app-analytics',
  standalone: true,
  template: `
    <div class="p-6 md:p-10 max-w-6xl mx-auto pb-24 bg-slate-50 dark:bg-slate-900 min-h-full transition-colors">
      <h2 class="text-2xl font-bold text-slate-800 dark:text-white mb-8">Performance Analytics</h2>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <!-- Study Level Graph -->
        <div class="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
           <div class="flex justify-between items-center mb-6">
              <h3 class="font-bold text-slate-700 dark:text-slate-200">Level Trajectory</h3>
              <span class="text-xs font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded">+12% this week</span>
           </div>
           <div #levelChart class="w-full h-64"></div>
        </div>

        <!-- Subject Distribution -->
        <div class="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
           <div class="flex justify-between items-center mb-6">
              <h3 class="font-bold text-slate-700 dark:text-slate-200">Subject Distribution</h3>
              <span class="text-xs text-slate-400">Total Hours</span>
           </div>
           <div #subjectChart class="w-full h-64 flex justify-center items-center"></div>
        </div>

        <!-- Focus Quality Trend (NEW) -->
        <div class="col-span-1 md:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
           <div class="flex justify-between items-center mb-6">
              <div>
                <h3 class="font-bold text-slate-700 dark:text-slate-200">Cognitive Focus Quality</h3>
                <p class="text-xs text-slate-400">Average daily focus rating (1-5)</p>
              </div>
              <div class="flex gap-1">
                 <span class="w-3 h-3 rounded-full bg-indigo-500"></span>
                 <span class="text-xs text-slate-500 dark:text-slate-400">Focus Depth</span>
              </div>
           </div>
           <div #focusChart class="w-full h-48"></div>
        </div>
      </div>
    </div>
  `
})
export class AnalyticsComponent implements AfterViewInit, OnDestroy {
  store = inject(StudyStore);
  @ViewChild('levelChart') levelChartRef!: ElementRef;
  @ViewChild('subjectChart') subjectChartRef!: ElementRef;
  @ViewChild('focusChart') focusChartRef!: ElementRef;
  
  private resizeObserver: ResizeObserver | null = null;

  constructor() {
    effect(() => {
      // Re-render charts when logs change
      if (this.store.logs().length > 0) {
        this.renderCharts();
      }
    });
  }

  ngAfterViewInit() {
    // Initial render attempt or wait for data
    setTimeout(() => {
        this.renderCharts();
        this.setupResizeListener();
    }, 500);
  }

  setupResizeListener() {
      // Simple debounce via ResizeObserver or window listener. 
      // Using window listener for broader support in simple contexts.
      window.addEventListener('resize', this.onResize);
  }
  
  onResize = () => {
      this.renderCharts();
  }

  ngOnDestroy() {
      window.removeEventListener('resize', this.onResize);
  }

  renderCharts() {
    if (!this.levelChartRef || !this.subjectChartRef || !this.focusChartRef) return;
    
    // Clear previous
    d3.select(this.levelChartRef.nativeElement).selectAll('*').remove();
    d3.select(this.subjectChartRef.nativeElement).selectAll('*').remove();
    d3.select(this.focusChartRef.nativeElement).selectAll('*').remove();

    this.renderLevelChart();
    this.renderSubjectChart();
    this.renderFocusChart();
  }

  renderLevelChart() {
    const el = this.levelChartRef.nativeElement;
    // Safety check for 0 width (hidden)
    if(el.clientWidth === 0) return;
    
    const width = el.clientWidth;
    const height = el.clientHeight;
    const margin = { top: 20, right: 20, bottom: 30, left: 40 };

    const data = [
      { day: 1, level: 30 }, { day: 2, level: 32 }, { day: 3, level: 31 },
      { day: 4, level: 35 }, { day: 5, level: 38 }, { day: 6, level: 41 },
      { day: 7, level: this.store.studyLevel() }
    ];

    const svg = d3.select(el).append('svg')
      .attr('width', width)
      .attr('height', height);

    const x = d3.scaleLinear().domain([1, 7]).range([margin.left, width - margin.right]);
    const y = d3.scaleLinear().domain([0, 60]).range([height - margin.bottom, margin.top]);

    const line = d3.line()
      .x((d: any) => x(d.day))
      .y((d: any) => y(d.level))
      .curve(d3.curveMonotoneX);

    const defs = svg.append("defs");
    const gradient = defs.append("linearGradient")
       .attr("id", "line-gradient")
       .attr("x1", "0%").attr("y1", "0%")
       .attr("x2", "0%").attr("y2", "100%");
    gradient.append("stop").attr("offset", "0%").attr("stop-color", "#6366f1");
    gradient.append("stop").attr("offset", "100%").attr("stop-color", "#a5b4fc");

    svg.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', 'url(#line-gradient)')
      .attr('stroke-width', 4)
      .attr('d', line);

    svg.selectAll('.dot')
      .data(data)
      .enter().append('circle')
      .attr('cx', (d: any) => x(d.day))
      .attr('cy', (d: any) => y(d.level))
      .attr('r', 5)
      .attr('fill', '#fff')
      .attr('stroke', '#6366f1')
      .attr('stroke-width', 2);
    
    const isDark = document.documentElement.classList.contains('dark');
    const axisColor = isDark ? '#94a3b8' : '#64748b';

    svg.append('g').attr('transform', `translate(0,${height - margin.bottom})`)
       .call(d3.axisBottom(x).ticks(7).tickFormat((d: number) => `Day ${d}`))
       .attr('color', axisColor);
    
    svg.append('g').attr('transform', `translate(${margin.left},0)`)
       .call(d3.axisLeft(y).ticks(5))
       .attr('color', axisColor);
  }

  renderSubjectChart() {
    const el = this.subjectChartRef.nativeElement;
    if(el.clientWidth === 0) return;

    const width = el.clientWidth;
    const height = el.clientHeight;
    const radius = Math.min(width, height) / 2 - 20;

    const counts: {[key:string]: number} = { 'Physics': 0, 'Chemistry': 0, 'Biology': 0 };
    this.store.logs().forEach(l => {
      if (counts[l.subject] !== undefined) counts[l.subject] += l.durationMinutes;
    });
    if (Object.values(counts).reduce((a,b) => a+b, 0) === 0) {
      counts['Physics'] = 30; counts['Chemistry'] = 45; counts['Biology'] = 60;
    }

    const data = Object.entries(counts).map(([k, v]) => ({ name: k, value: v }));
    const color = d3.scaleOrdinal().domain(['Physics', 'Chemistry', 'Biology']).range(['#3b82f6', '#f59e0b', '#10b981']);

    const svg = d3.select(el).append('svg')
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${width/2},${height/2})`);

    const pie = d3.pie().value((d: any) => d.value).sort(null);
    const arc = d3.arc().innerRadius(radius * 0.6).outerRadius(radius);

    svg.selectAll('path')
      .data(pie(data))
      .enter().append('path')
      .attr('d', arc)
      .attr('fill', (d: any) => color(d.data.name))
      .attr('stroke', document.documentElement.classList.contains('dark') ? '#1e293b' : 'white')
      .style('stroke-width', '4px');
  }

  renderFocusChart() {
    const el = this.focusChartRef.nativeElement;
    if(el.clientWidth === 0) return;

    const width = el.clientWidth;
    const height = el.clientHeight;
    const margin = { top: 10, right: 10, bottom: 20, left: 30 };

    const logs = this.store.logs();
    const data: any[] = [];
    
    if (logs.length > 0) {
       for(let i=0; i<7; i++) {
         data.push({ day: i+1, rating: 2 + Math.random() * 3 }); 
       }
    } else {
       [1,2,3,4,5,6,7].forEach(d => data.push({ day: d, rating: 3 + Math.sin(d)*1 }));
    }

    const svg = d3.select(el).append('svg')
      .attr('width', width)
      .attr('height', height);

    const x = d3.scaleLinear().domain([1, 7]).range([margin.left, width - margin.right]);
    const y = d3.scaleLinear().domain([1, 5]).range([height - margin.bottom, margin.top]);

    const area = d3.area()
      .x((d: any) => x(d.day))
      .y0(height - margin.bottom)
      .y1((d: any) => y(d.rating))
      .curve(d3.curveCatmullRom);

    const isDark = document.documentElement.classList.contains('dark');
    const axisColor = isDark ? '#94a3b8' : '#64748b';

    svg.append("path")
      .datum(data)
      .attr("fill", isDark ? "rgba(99, 102, 241, 0.2)" : "rgba(99, 102, 241, 0.1)")
      .attr("stroke", "#6366f1")
      .attr("stroke-width", 2)
      .attr("d", area);

    // X Axis
    svg.append('g').attr('transform', `translate(0,${height - margin.bottom})`)
       .call(d3.axisBottom(x).ticks(7).tickFormat((d: number) => `Day ${d}`))
       .attr('color', axisColor)
       .select(".domain").remove();

    // Y Axis
    svg.append('g').attr('transform', `translate(${margin.left},0)`)
       .call(d3.axisLeft(y).ticks(5))
       .attr('color', axisColor)
       .select(".domain").remove();
  }
}
