/**
 * @author Deniz Ugur <deniz343@gmail.com>
 */
import { ButtonCSS } from "@adminjs/design-system";
import styled from "styled-components";

export const SubmitButton = styled.button`
	${ButtonCSS}
	min-height: 10vh;
	cursor: pointer;
	font-size: 3rem;
	margin: 0 3vw;
`;

export const SubmitContainer = styled.div`
	display: flex;
	justify-content: center;
	flex-direction: row;
	padding: 2vh 0;
`;

export const Parent = styled.div`
	display: flex;
	flex-direction: column;
	justify-content: center;
	height: calc(100% - 64px - 48px);
`;

export const DropArea = styled.div`
	display: flex;
	flex-direction: row;
	min-height: 40vh;
	min-width: 40vh;
`;

export const UpdateArea = styled.div`
	display: flex;
	flex-direction: row;
	align-items: center;
	justify-content: center;
	height: calc(100% - 64px - 48px);
`;

export const File = styled.div`
	display: flex;
	flex-direction: column;
	margin-top: 32px;
	width: fit-content;

	padding: 4px 8px;
	background-color: #d4d3d3;
	border-radius: 0.25rem;

	img {
		width: 64px;
		align-self: center;
	}

	span {
		width: fit-content;
		margin: 8px 0;
		padding: 0.25rem 0.5rem;
		text-align: center;
		background-color: #444e58;
		color: #fff;
		border-radius: 0.25rem;
	}
`;

export const DropZoneParent = styled.div`
	display: flex;
	flex-direction: column;
	flex: 1;
	margin: 0 3vw;

	h1 {
		text-align: center;
		font-size: 2rem;
		margin-bottom: 16px;
	}
`;

export const CustomCell = styled.td`
	font-size: 14px;
	line-height: 16px;
	vertical-align: middle;
	color: #1c1c38;
	padding: 4px;
`;

export const TableContainer = styled.div`
	flex: 1;
	justify-content: center;
	max-height: 40vh;
	overflow-y: scroll;
`;
