declare namespace Express {
	export interface Request {
		user: {
			oid: string;
			displayName: string;
			email: string;
			sid: string;
			enrolled: boolean;
			level: number;
		};
		session: any;
	}
}
