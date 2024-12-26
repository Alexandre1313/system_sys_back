import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";

export default function convertSPTime(dateString: string): string {
    const timeZone = 'America/Sao_Paulo';  
    let date = new Date(dateString); 
    if (isNaN(date.getTime())) {
      console.error('Invalid Date:', dateString);
      date = new Date();
    } 
    const zonedDate = toZonedTime(date, timeZone); 
    return format(zonedDate, 'dd/MM/yyyy HH:mm:ss');
  } 
