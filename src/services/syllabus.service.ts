
import { Injectable, signal } from '@angular/core';

export interface ResourceLink {
  file_name: string;
  file_type: 'NCERT_PDF' | 'Notes' | 'PYQ' | 'Formula_Sheet';
  upload_date: string;
}

export interface Chapter {
  id: string;
  name: string;
  resource_links: ResourceLink[];
}

export interface Unit {
  name: string;
  chapters: Chapter[];
}

export interface SyllabusData {
  subject: 'Physics' | 'Chemistry' | 'Biology';
  class_level: 11 | 12;
  units: Unit[];
}

@Injectable({
  providedIn: 'root'
})
export class SyllabusService {
  // Master Syllabus Data (NEET 2026 Rationalized Schema)
  // Note: Reduced set for demo purposes, but structure is complete.
  private initialData: SyllabusData[] = [
    {
      subject: 'Physics',
      class_level: 11,
      units: [
        {
          name: 'Kinematics',
          chapters: [
            { id: 'PHY_11_01', name: 'Motion in a Straight Line', resource_links: [] },
            { id: 'PHY_11_02', name: 'Motion in a Plane', resource_links: [] }
          ]
        },
        {
          name: 'Laws of Motion',
          chapters: [
            { id: 'PHY_11_03', name: 'Laws of Motion', resource_links: [] }
          ]
        },
        {
            name: 'Work, Energy and Power',
            chapters: [
              { id: 'PHY_11_04', name: 'Work, Energy and Power', resource_links: [] }
            ]
        }
      ]
    },
    {
      subject: 'Physics',
      class_level: 12,
      units: [
        {
            name: 'Electrostatics',
            chapters: [
                { id: 'PHY_12_01', name: 'Electric Charges and Fields', resource_links: [] },
                { id: 'PHY_12_02', name: 'Electrostatic Potential and Capacitance', resource_links: [] }
            ]
        },
        {
            name: 'Current Electricity',
            chapters: [
                { id: 'PHY_12_03', name: 'Current Electricity', resource_links: [] }
            ]
        }
      ]
    },
    {
      subject: 'Chemistry',
      class_level: 11,
      units: [
        {
            name: 'Structure of Atom',
            chapters: [
                { id: 'CHE_11_01', name: 'Structure of Atom', resource_links: [] }
            ]
        },
        {
            name: 'Chemical Bonding',
            chapters: [
                { id: 'CHE_11_02', name: 'Chemical Bonding and Molecular Structure', resource_links: [] }
            ]
        },
        {
            name: 'Thermodynamics',
            chapters: [
                { id: 'CHE_11_03', name: 'Thermodynamics', resource_links: [] }
            ]
        }
      ]
    },
    {
        subject: 'Chemistry',
        class_level: 12,
        units: [
          {
              name: 'Solutions',
              chapters: [
                  { id: 'CHE_12_01', name: 'Solutions', resource_links: [] }
              ]
          },
          {
              name: 'Electrochemistry',
              chapters: [
                  { id: 'CHE_12_02', name: 'Electrochemistry', resource_links: [] }
              ]
          },
          {
              name: 'Chemical Kinetics',
              chapters: [
                  { id: 'CHE_12_03', name: 'Chemical Kinetics', resource_links: [] }
              ]
          }
        ]
      },
    {
      subject: 'Biology',
      class_level: 11,
      units: [
        {
            name: 'Diversity in Living World',
            chapters: [
                { id: 'BIO_11_01', name: 'The Living World', resource_links: [] },
                { id: 'BIO_11_02', name: 'Biological Classification', resource_links: [] },
                { id: 'BIO_11_03', name: 'Plant Kingdom', resource_links: [] },
                { id: 'BIO_11_04', name: 'Animal Kingdom', resource_links: [] }
            ]
        },
        {
            name: 'Human Physiology',
            chapters: [
                { id: 'BIO_11_05', name: 'Breathing and Exchange of Gases', resource_links: [] },
                { id: 'BIO_11_06', name: 'Body Fluids and Circulation', resource_links: [] }
            ]
        }
      ]
    },
    {
        subject: 'Biology',
        class_level: 12,
        units: [
          {
              name: 'Reproduction',
              chapters: [
                  { id: 'BIO_12_01', name: 'Sexual Reproduction in Flowering Plants', resource_links: [] },
                  { id: 'BIO_12_02', name: 'Human Reproduction', resource_links: [] },
                  { id: 'BIO_12_03', name: 'Reproductive Health', resource_links: [] }
              ]
          },
          {
              name: 'Genetics and Evolution',
              chapters: [
                  { id: 'BIO_12_04', name: 'Principles of Inheritance and Variation', resource_links: [] },
                  { id: 'BIO_12_05', name: 'Molecular Basis of Inheritance', resource_links: [] }
              ]
          }
        ]
      }
  ];

  syllabus = signal<SyllabusData[]>(this.initialData);

  constructor() {
    this.loadResources();
  }

  // Flattened view helper for AI context
  getAllChapterNames(): {id: string, name: string, subject: string}[] {
    const list: {id: string, name: string, subject: string}[] = [];
    this.syllabus().forEach(s => {
      s.units.forEach(u => {
        u.chapters.forEach(c => {
          list.push({ id: c.id, name: c.name, subject: s.subject });
        });
      });
    });
    return list;
  }

  addResource(chapterId: string, resource: ResourceLink) {
    this.syllabus.update(data => {
      // Deep clone to trigger change detection
      const newData = JSON.parse(JSON.stringify(data));
      
      // Find and update
      for (const group of newData) {
        for (const unit of group.units) {
          const chapter = unit.chapters.find((c: Chapter) => c.id === chapterId);
          if (chapter) {
            chapter.resource_links.push(resource);
            return newData;
          }
        }
      }
      return newData;
    });
    this.saveResources();
  }

  addChapter(subject: string, unitName: string, chapterName: string) {
    this.syllabus.update(data => {
      const newData = JSON.parse(JSON.stringify(data));
      
      // Try to find existing unit first across all class levels for this subject
      let targetUnit: any = null;
      let targetGroup: any = null;

      for (const group of newData) {
        if (group.subject === subject) {
           const foundUnit = group.units.find((u: any) => u.name.toLowerCase() === unitName.toLowerCase());
           if (foundUnit) {
             targetUnit = foundUnit;
             break;
           }
           // Keep track of a fallback group (e.g. the first one found) to create new unit if needed
           if (!targetGroup) targetGroup = group;
        }
      }

      if (targetUnit) {
         targetUnit.chapters.push({
            id: `CUST_${Date.now()}`,
            name: chapterName,
            resource_links: []
         });
      } else if (targetGroup) {
         // Create new unit in the first available group for this subject
         targetGroup.units.push({
            name: unitName,
            chapters: [{
               id: `CUST_${Date.now()}`,
               name: chapterName,
               resource_links: []
            }]
         });
      }

      return newData;
    });
  }

  private saveResources() {
    // In a real app, save to DB. Here we just mock persistence of the structure
    // We only save the resource links part to local storage to keep it simple
    const resources = this.getAllChapterNames().reduce((acc: any, curr) => {
        const links = this.getLinksForChapter(curr.id);
        if(links.length > 0) acc[curr.id] = links;
        return acc;
    }, {});
    localStorage.setItem('organizer_resources', JSON.stringify(resources));
  }

  private loadResources() {
    const saved = localStorage.getItem('organizer_resources');
    if (saved) {
      const resourceMap = JSON.parse(saved);
      this.syllabus.update(data => {
        const newData = JSON.parse(JSON.stringify(data));
        for (const group of newData) {
            for (const unit of group.units) {
              for (const chapter of unit.chapters) {
                  if(resourceMap[chapter.id]) {
                      chapter.resource_links = resourceMap[chapter.id];
                  }
              }
            }
          }
        return newData;
      });
    }
  }

  private getLinksForChapter(id: string): ResourceLink[] {
      let links: ResourceLink[] = [];
      this.syllabus().forEach(s => s.units.forEach(u => u.chapters.forEach(c => {
          if(c.id === id) links = c.resource_links;
      })));
      return links;
  }
}
