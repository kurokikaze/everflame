export type Challenge = {
    userId: string
    comment: string
    dateCreated: Date
    deck: string[]
    id: string
}

export interface ISingleJwt {
    secret: string;
    time: number;
  }
  
  export interface IAccessJwt {
    publicKey: string;
    privateKey: string;
    time: number;
  }
  
  export interface IJwt {
    access: IAccessJwt;
    confirmation: ISingleJwt;
    resetPassword: ISingleJwt;
    refresh: ISingleJwt;
  }
  