/**
 * IDataChangeNotifier - интерфейс для уведомления об изменениях данных
 */

export interface IDataChangeNotifier {
  notifyChange(domain: string, data: any): void;
  notifyGroup<T>(actionType: string, callback: () => Promise<T | ((batch: Map<string, any>) => any)>): Promise<any>;
}
