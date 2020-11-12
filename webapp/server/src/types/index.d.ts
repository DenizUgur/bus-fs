declare namespace Express {
	export interface Request {
		user: {
			mail: string;
			level: number;
			id: string | null;
		};
		session: {
			type: string;
			save: any;
			reload: any;
		};
	}
}
