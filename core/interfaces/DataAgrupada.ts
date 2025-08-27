import ExpedicaoResumoPDItem from "./ExpedicaoResumoPDItem";

export default interface DataAgrupada {
  data: string | null;
  items: ExpedicaoResumoPDItem[];
}
