export interface ComponenteDoKit {
  item: string;
  genero: string;
  quantidade: number;
  tamanho: string;
}

export interface ItemsInserction2 {
  projeto: string;
  item: string;
  genero: string;
  tamanhos: string[];
  isKit: boolean,
  composicao?: Record<string, ComponenteDoKit[]>;
}
