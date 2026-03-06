import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Timeline } from './timeline';

describe('Timeline', () => {
  let component: Timeline;
  let fixture: ComponentFixture<Timeline>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Timeline],
    }).compileComponents();

    fixture = TestBed.createComponent(Timeline);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // --- Timescale defaults ---

  describe('timescale', () => {
    it('defaults to Month', () => {
      expect(component.timescale()).toBe('Month');
    });

    it('timescaleOpen defaults to false', () => {
      expect(component.timescaleOpen()).toBe(false);
    });

    it('selectTimescale updates the timescale signal', () => {
      component.selectTimescale('Week');
      expect(component.timescale()).toBe('Week');
    });

    it('selectTimescale closes the dropdown', () => {
      component.timescaleOpen.set(true);
      component.selectTimescale('Day');
      expect(component.timescaleOpen()).toBe(false);
    });
  });

  // --- Column generation ---

  describe('visibleColumns', () => {
    it('generates 13 columns in Month view', () => {
      component.timescale.set('Month');
      const cols = (component as any).visibleColumns();
      expect(cols.length).toBe(13);
    });

    it('generates 17 columns in Week view', () => {
      component.timescale.set('Week');
      const cols = (component as any).visibleColumns();
      expect(cols.length).toBe(17);
    });

    it('generates 29 columns in Day view', () => {
      component.timescale.set('Day');
      const cols = (component as any).visibleColumns();
      expect(cols.length).toBe(29);
    });

    it('each column has a startDate before its endDate', () => {
      component.timescale.set('Month');
      const cols = (component as any).visibleColumns();
      for (const col of cols) {
        expect(col.startDate.getTime()).toBeLessThan(col.endDate.getTime());
      }
    });

    it('columns are contiguous — each endDate is close to the next startDate', () => {
      component.timescale.set('Week');
      const cols = (component as any).visibleColumns();
      for (let i = 0; i < cols.length - 1; i++) {
        const gap = cols[i + 1].startDate.getTime() - cols[i].endDate.getTime();
        // Gap should be at most 1 second (due to the 23:59:59 end time)
        expect(gap).toBeLessThanOrEqual(1000);
      }
    });
  });

  // --- Bar style calculation ---

  describe('calcBarStyle', () => {
    it('positions a bar that spans the full grid at left 0% and width 100%', () => {
      component.timescale.set('Month');
      const gridStart = (component as any).gridStart() as Date;
      const gridEnd = (component as any).gridEnd() as Date;

      const wo = {
        docId: 'wo-test', docType: 'workOrder' as const,
        data: {
          name: 'Test', workCenterId: 'wc-1', status: 'open' as const,
          startDate: gridStart.toISOString().split('T')[0],
          endDate: gridEnd.toISOString().split('T')[0],
        }
      };

      const style = (component as any).calcBarStyle(wo);
      expect(parseFloat(style.left)).toBeCloseTo(0, 0);
      expect(parseFloat(style.width)).toBeCloseTo(100, 0);
    });

    it('clamps a bar that starts before the grid to left 0%', () => {
      component.timescale.set('Month');
      const gridEnd = (component as any).gridEnd() as Date;

      const wo = {
        docId: 'wo-test', docType: 'workOrder' as const,
        data: {
          name: 'Test', workCenterId: 'wc-1', status: 'open' as const,
          startDate: '2000-01-01',
          endDate: gridEnd.toISOString().split('T')[0],
        }
      };

      const style = (component as any).calcBarStyle(wo);
      expect(parseFloat(style.left)).toBe(0);
    });

    it('returns width 0% for a bar entirely outside the grid', () => {
      component.timescale.set('Month');

      const wo = {
        docId: 'wo-test', docType: 'workOrder' as const,
        data: {
          name: 'Test', workCenterId: 'wc-1', status: 'open' as const,
          startDate: '2000-01-01',
          endDate: '2000-01-31',
        }
      };

      const style = (component as any).calcBarStyle(wo);
      expect(parseFloat(style.width)).toBe(0);
    });
  });

  // --- Panel state ---

  describe('panel', () => {
    it('panelOpen defaults to false', () => {
      expect(component.panelOpen()).toBe(false);
    });

    it('onPanelSaved closes the panel', () => {
      component.panelOpen.set(true);
      component.onPanelSaved();
      expect(component.panelOpen()).toBe(false);
    });

    it('onPanelCancelled closes the panel', () => {
      component.panelOpen.set(true);
      component.onPanelCancelled();
      expect(component.panelOpen()).toBe(false);
    });

    it('onBackdropClick closes the panel', () => {
      component.panelOpen.set(true);
      component.onBackdropClick();
      expect(component.panelOpen()).toBe(false);
    });
  });
});
