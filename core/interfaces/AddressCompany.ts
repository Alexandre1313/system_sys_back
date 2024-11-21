export default interface AddressCompany {
    id?: number;
    street:       string;
    number?:       string;
    complement?:   string;
    neighborhood: string;
    city:         string;
    state:        string;
    postalCode:   string;
    country:      string;
    createdAt?:    Date;
    updatedAt?:    Date;
    companyId:    number;   
}
