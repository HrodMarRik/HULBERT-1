export interface WidgetConfig {
  id: string;
  type: WidgetType;
  position: WidgetPosition;
  size: WidgetSize;
  config: Record<string, any>;
  data?: any;
}

export interface WidgetPosition {
  col: number;
  row: number;
}

export interface WidgetSize {
  cols: number;
  rows: number;
}

export type WidgetType = 
  | 'ticket-stats'
  | 'agent-stats'
  | 'chart'
  | 'todo'
  | 'quick-actions'
  | 'recent-activity'
  | 'open-tickets';

export interface DashboardConfig {
  version: string;
  widgets: WidgetConfig[];
}

export interface WidgetCatalogItem {
  type: WidgetType;
  name: string;
  description: string;
  icon: string;
  defaultSize: WidgetSize;
  category: 'stats' | 'charts' | 'tools' | 'personal';
}

export interface WidgetData {
  loading: boolean;
  error?: string;
  lastUpdated?: Date;
}
