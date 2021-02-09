/**
 * @author Deniz Ugur <deniz343@gmail.com>
 */
import React from "react";
import {
	Table,
	TableRow,
	TableHead,
	TableBody,
} from "@admin-bro/design-system";
import { TableContainer, CustomCell } from "../components/styles";
import { Cell } from "../api";

export default function UserTable(props: any) {
	const { data } = props;
	const colors = {
		added: "#59886b",
		deleted: "#c05555",
		modified: "#ffc85c",
	};

	return (
		<TableContainer>
			<Table>
				<TableHead>
					<TableRow>
						<CustomCell>Email</CustomCell>
						<CustomCell>Student ID</CustomCell>
						<CustomCell>Level</CustomCell>
					</TableRow>
				</TableHead>
				<TableBody>
					{data.map((el: Cell) => {
						return (
							el.state && (
								<TableRow
									style={{
										backgroundColor: colors[el.state],
									}}
									key={el.email}
								>
									<CustomCell>{el.email}</CustomCell>
									<CustomCell>{el.sid}</CustomCell>
									<CustomCell>{el.level}</CustomCell>
								</TableRow>
							)
						);
					})}
				</TableBody>
			</Table>
		</TableContainer>
	);
}
