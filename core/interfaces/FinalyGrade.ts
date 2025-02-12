import { Status } from "@prisma/client";

export default interface FinalyGrade {
    id: number;
    finalizada: boolean;
    status: Status;
}
