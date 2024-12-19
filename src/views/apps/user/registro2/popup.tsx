import type React from 'react'

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Checkbox,
  IconButton,
  Box,
  Card,
  CardContent
} from '@mui/material'

interface PopUpProps {
  open: boolean
  handleClose: () => void
}

const PopUp: React.FC<PopUpProps> = ({ open, handleClose }) => {}

export default PopUp
