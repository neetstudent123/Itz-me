import { Component, inject, ElementRef, ViewChild, AfterViewInit, effect } from '@angular/core';
import { StudyStore } from '../services/study-store.service';
declare const d3: any;

@Component({
  selector: 'app-analytics',
  standalone: true,
  template: `
    <div class="p-6 md:p-10 max-w-6xl mx-auto pb-24">
      <h2 class="text-2xl font-bold text-slate-800 mb-8">Performance Analytics</h2>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <!-- Study Level Graph -->
        <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
           <div class="flex justify-between items-center mb-6">
              <h3 class="font-bold text-slate-700">Level Trajectory</h3>
              <span class="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded">+12% this week</span>
           </div>
           <div #levelChart class="w-full h-64"></div>
        </div>

        <!-- Subject Distribution -->
        <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
           <div class="flex justify-between items-center mb-6">
              <h3 class="font-bold text-slate-700">Subject Distribution</h3>
              <span class="text-xs text-slate-400">Total Hours</span>
           </div>
           <div #subjectChart class="w-full h-64 flex justify-center items-center"></div>
        </div>
      </div>
    </div>
  `
})
export class AnalyticsComponent implements AfterViewInit {
  store = inject(StudyStore);
  @ViewChild('levelChart') levelChartRef!: ElementRef;
  @ViewChild('subjectChart') subjectChartRef!: ElementRef;

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
    setTimeout(() => this.renderCharts(), 500);
  }

  renderCharts() {
    if (!this.levelChartRef || !this.subjectChartRef) return;
    
    // Clear previous
    d3.select(this.levelChartRef.nativeElement).selectAll('*').remove();
    d3.select(this.subjectChartRef.nativeElement).selectAll('*').remove();

    this.renderLevelChart();
    this.renderSubjectChart();
  }

  renderLevelChart() {
    const el = this.levelChartRef.nativeElement;
    const width = el.clientWidth;
    const height = el.clientHeight;
    const margin = { top: 20, right: 20, bottom: 30, left: 40 };

    // Mock Data based on logs + projection
    const data = [
      { day: 1, level: 30 }, { day: 2, level: 32 }, { day: 3, level: 31 },
      { day: 4, level: 35 }, { day: 5, level: 38 }, { day: 6, level: 41 },
      { day: 7, level: this.store.studyLevel() } // Current
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

    // Gradient
    const defs = svg.append("defs");
    const gradient = defs.append("linearGradient")
       .attr("id", "line-gradient")
       .attr("x1", "0%").attr("y1", "0%")
       .attr("x2", "0%").attr("y2", "100%");
    gradient.append("stop").attr("offset", "0%").attr("stop-color", "#6366f1");
    gradient.append("stop").attr("offset", "100%").attr("stop-color", "#a5b4fc");

    // Path
    svg.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', 'url(#line-gradient)')
      .attr('stroke-width', 4)
      .attr('d', line);

    // Dots
    svg.selectAll('.dot')
      .data(data)
      .enter().append('circle')
      .attr('cx', (d: any) => x(d.day))
      .attr('cy', (d: any) => y(d.level))
      .attr('r', 5)
      .attr('fill', '#fff')
      .attr('stroke', '#6366f1')
      .attr('stroke-width', 2);
    
    // Axes
    svg.append('g').attr('transform', `translate(0,${height - margin.bottom})`)
       .call(d3.axisBottom(x).ticks(7).tickFormat((d: number) => `Day ${d}`));
    
    svg.append('g').attr('transform', `translate(${margin.left},0)`)
       .call(d3.axisLeft(y).ticks(5));
  }

  renderSubjectChart() {
    const el = this.subjectChartRef.nativeElement;
    const width = el.clientWidth;
    const height = el.clientHeight;
    const radius = Math.min(width, height) / 2 - 20;

    // Aggregate Logs
    const counts: {[key:string]: number} = { 'Physics': 0, 'Chemistry': 0, 'Biology': 0 };
    this.store.logs().forEach(l => {
      if (counts[l.subject] !== undefined) counts[l.subject] += l.durationMinutes;
    });
    // Add dummy data if empty for viz
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
      .attr('stroke', 'white')
      .style('stroke-width', '2px');
      
    // Labels in center (optional) or legend
  }
}