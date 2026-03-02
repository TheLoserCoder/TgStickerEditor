export enum GridContextAction {
  CREATE_GROUP = 'CREATE_GROUP',
  DELETE_FRAGMENTS = 'DELETE_FRAGMENTS',
  REMOVE_FROM_GROUP = 'REMOVE_FROM_GROUP',
  DELETE_GROUP = 'DELETE_GROUP',
  DELETE_GROUP_WITH_FRAGMENTS = 'DELETE_GROUP_WITH_FRAGMENTS',
  DELETE_GROUP_KEEP_FRAGMENTS = 'DELETE_GROUP_KEEP_FRAGMENTS',
  SELECT_ALL = 'SELECT_ALL',
  DESELECT_ALL = 'DESELECT_ALL',
  SELECT_GROUP = 'SELECT_GROUP'
}

export const GRID_CONTEXT_LABELS = {
  CREATE_GROUP: 'Создать группу',
  DELETE: 'Удалить',
  DELETE_FRAGMENTS: 'Удалить фрагменты',
  REMOVE_FROM_GROUP: 'Удалить из группы',
  DELETE_GROUP: 'Удалить группу',
  DELETE_GROUP_WITH_FRAGMENTS: 'Удалить группу и фрагменты',
  DELETE_GROUP_KEEP_FRAGMENTS: 'Удалить группу, оставить фрагменты',
  SELECT: 'Выделение',
  SELECT_ALL: 'Выделить всё',
  DESELECT_ALL: 'Снять выделение',
  SELECT_GROUP: 'Выделить группу'
} as const;

export const GRID_CONTEXT_CONFIRMATIONS = {
  DELETE_FRAGMENTS: {
    title: 'Удалить фрагменты?',
    message: (count: number) => `Вы уверены, что хотите удалить ${count} фрагмент(ов)?`,
    confirmText: 'Удалить',
    cancelText: 'Отмена'
  },
  DELETE_GROUP_WITH_FRAGMENTS: {
    title: 'Удалить группу и фрагменты?',
    message: 'Вы уверены? Все фрагменты группы будут удалены.',
    confirmText: 'Удалить',
    cancelText: 'Отмена'
  }
} as const;
