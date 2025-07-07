"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";

import { ProjectsTableRow } from "@/components/projects/projects-table-row";
import { ProjectsTableContainer } from "@/styles/projects/projects-table.styles";
import { trpc } from "@/utils/trpc";

export function ProjectsTable() {
  const { data: projects, isLoading } = trpc.projects.getAll.useQuery();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <ProjectsTableContainer>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Project Name</TableCell>
              <TableCell>Languages</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="center">Missing</TableCell>
              <TableCell>Last Updated</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {projects?.map((project) => (
              <ProjectsTableRow key={project.id} project={project} />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </ProjectsTableContainer>
  );
}
