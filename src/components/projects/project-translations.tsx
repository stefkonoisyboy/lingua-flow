"use client";

import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Select,
  MenuItem,
  SelectChangeEvent,
  Typography,
} from "@mui/material";
import { Add as AddIcon, Comment as CommentIcon } from "@mui/icons-material";
import { useState } from "react";

import {
  StyledHeader,
  StyledTableHeaderCell,
  StyledTranslationCell,
  StyledCommentButton,
  StyledTitleContainer,
  StyledActionsContainer,
  StyledTranslationTextField,
  StyledKeyTextField,
  StyledContainer,
} from "@/styles/projects/project-translations.styles";

export function ProjectTranslations() {
  const [selectedLanguage, setSelectedLanguage] = useState("en");

  const handleLanguageChange = (event: SelectChangeEvent) => {
    setSelectedLanguage(event.target.value);
  };

  return (
    <StyledContainer elevation={2}>
      <StyledHeader>
        <StyledTitleContainer>
          <Typography variant="h5" component="h1">
            Manage Translations
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Edit, add, or review translation strings for different locales.
          </Typography>
        </StyledTitleContainer>

        <StyledActionsContainer>
          <Select
            value={selectedLanguage}
            onChange={handleLanguageChange}
            size="small"
            sx={{ minWidth: 200, mr: 2 }}
          >
            <MenuItem value="en">English</MenuItem>
            <MenuItem value="es">Spanish</MenuItem>
            <MenuItem value="fr">French</MenuItem>
          </Select>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => console.log("Add key clicked")}
          >
            Add Key
          </Button>
        </StyledActionsContainer>
      </StyledHeader>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <StyledTableHeaderCell>Key Name</StyledTableHeaderCell>
              <StyledTableHeaderCell>English (Source)</StyledTableHeaderCell>
              <StyledTableHeaderCell>
                {selectedLanguage === "en"
                  ? "English"
                  : selectedLanguage === "es"
                  ? "Spanish"
                  : "French"}
              </StyledTableHeaderCell>
              <StyledTableHeaderCell align="right">
                Actions
              </StyledTableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell>
                <StyledKeyTextField
                  value="homepage.title"
                  fullWidth
                  size="small"
                  variant="outlined"
                />
              </TableCell>
              <StyledTranslationCell>
                <StyledTranslationTextField
                  value="Welcome to our Store!"
                  fullWidth
                  multiline
                  minRows={2}
                  variant="outlined"
                />
              </StyledTranslationCell>
              <StyledTranslationCell>
                <StyledTranslationTextField
                  value="¡Bienvenidos a nuestra tienda!"
                  fullWidth
                  multiline
                  minRows={2}
                  variant="outlined"
                />
              </StyledTranslationCell>
              <TableCell align="right">
                <StyledCommentButton>
                  <CommentIcon />
                </StyledCommentButton>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>
                <StyledKeyTextField
                  value="product.addToCart"
                  fullWidth
                  size="small"
                  variant="outlined"
                />
              </TableCell>
              <StyledTranslationCell>
                <StyledTranslationTextField
                  value="Add to Cart"
                  fullWidth
                  multiline
                  minRows={2}
                  variant="outlined"
                />
              </StyledTranslationCell>
              <StyledTranslationCell>
                <StyledTranslationTextField
                  value="Añadir al carrito"
                  fullWidth
                  multiline
                  minRows={2}
                  variant="outlined"
                />
              </StyledTranslationCell>
              <TableCell align="right">
                <StyledCommentButton>
                  <CommentIcon />
                </StyledCommentButton>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>
                <StyledKeyTextField
                  value="checkout.button"
                  fullWidth
                  size="small"
                  variant="outlined"
                />
              </TableCell>
              <StyledTranslationCell>
                <StyledTranslationTextField
                  value="Proceed to Checkout"
                  fullWidth
                  multiline
                  minRows={2}
                  variant="outlined"
                />
              </StyledTranslationCell>
              <StyledTranslationCell>
                <StyledTranslationTextField
                  value="Proceder al pago"
                  fullWidth
                  multiline
                  minRows={2}
                  variant="outlined"
                />
              </StyledTranslationCell>
              <TableCell align="right">
                <StyledCommentButton>
                  <CommentIcon />
                </StyledCommentButton>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </StyledContainer>
  );
}
