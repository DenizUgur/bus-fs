declare namespace Express {
	export interface Request {
		user: {
			mail: string;
			level: number;
			id: string | null;
		};
		session: any;
	}
}
