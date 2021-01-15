import * as React from "react";
import { ReactNode, useEffect, useRef, useState } from "react";
import { IListItemsHooksProps } from "./IListItemsHooksProps";
import ReactToPrint from "react-to-print";
import {
  withStyles,
  Theme,
  createStyles,
  makeStyles,
} from "@material-ui/core/styles";
import Paper from "@material-ui/core/Paper";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableContainer from "@material-ui/core/TableContainer";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import fakeJsonGenerator from "./utils/fakeJsonGenerator";
import useWindowDimensions from "./utils/useWindowDimensions";
import { Pagination } from "@material-ui/lab";
import TruncatedText from "./TruncatedText";
import {
  Box,
  Chip,
  Collapse,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  TextField,
} from "@material-ui/core";
import ArrowDropDownIcon from "@material-ui/icons/ArrowDropDown";
import ArrowRightIcon from "@material-ui/icons/ArrowRight";
import CsvDownload from "react-json-to-csv";
import Menu from "@material-ui/core/Menu";
import MoreVertIcon from "@material-ui/icons/MoreVert";
import { searchByColumn } from "./utils/ColumnSearch";
const { jsPDF } = require("jspdf");
require("jspdf-autotable");

interface Column {
  id: keyof RowData;
  label: string;
  align?: "right" | "left" | "center" | "inherit" | "justify" | undefined;
  minWidth?: number;
  maxWidth?: number;
  isNumeric?: boolean;
  secondParameter?: any;
  render?: (value: string | number, secondParameter?: any) => ReactNode;
}

interface RowData {
  orderId: string;
  name: string;
  amount: number | string;
  country: string;
  type: string;
  status: string;
  address: string;
  date: string;
}

const columns: Column[] = [
  { id: "orderId", label: "OrderId" },
  { id: "name", label: "Name" },
  {
    id: "amount",
    label: "Amount",
    isNumeric: true,
    render: (value) => <span style={{ color: "#009BE5" }}>US${value} </span>,
  },
  {
    id: "date",
    label: "Date",
    align: "center",
  },
  {
    id: "address",
    label: "Address",
    minWidth: 50,
    maxWidth: 100,
    align: "left",
    render: (value) =>
      typeof value === "string" && value.length > 40 ? (
        <TruncatedText text={value} />
      ) : (
        value
      ),
  },
  {
    id: "country",
    label: "Country",
    align: "left",
  },
  {
    id: "status",
    label: "Status",
    align: "center",
    secondParameter: {
      Danger: "#E21717",
      Pending: "#207398",
      Success: "#3DBE29",
      Cancelled: "#758283",
      Info: "#E07C24",
    },
    render: (value, colors) => (
      <Chip
        label={value}
        style={{
          backgroundColor: colors ? colors[value] : "",
          color: "white",
        }}
        size="small"
      />
    ),
  },
  {
    id: "type",
    label: "Type",
    align: "center",
    secondParameter: {
      Online: "#3DBE29",
      Retail: "#E07C24",
      Direct: "#758283",
    },
    render: (value, colors) => (
      <span style={{ color: colors[value] }}>{value}</span>
    ),
  },
];

const useStyles = makeStyles({
  root: {
    margin: "40px auto",
  },
});

const StyledTableRow = withStyles((theme: Theme) =>
  createStyles({
    root: {
      "&:nth-of-type(odd)": {
        backgroundColor: theme.palette.action.hover,
      },
    },
  })
)(TableRow);

function Row(props: { row: RowData; columns: Column[]; expandAll: boolean }) {
  const { row, columns, expandAll } = props;
  const [open, setOpen] = React.useState(false);
  const { width } = useWindowDimensions();

  useEffect(() => {
    setOpen(expandAll);
  }, [expandAll]);

  return (
    <React.Fragment>
      <StyledTableRow hover role="checkbox" tabIndex={-1} key={row.orderId}>
        <TableCell>
          {columns.length * 300 > width ? (
            <>
              <IconButton
                aria-label="expand row"
                size="small"
                onClick={() => setOpen(!open)}
              >
                {open ? <ArrowDropDownIcon /> : <ArrowRightIcon />}
              </IconButton>
            </>
          ) : (
            ""
          )}
        </TableCell>
        {columns.map((column, i) => {
          const value = row[column.id];
          return (i + 1) * 300 < width ? (
            <TableCell key={column.id} align={column.align}>
              {!!column.render
                ? column.render(
                    value,
                    column.secondParameter ? column.secondParameter : undefined
                  )
                : value}
            </TableCell>
          ) : (
            ""
          );
        })}
      </StyledTableRow>
      <TableCell
        style={{ paddingBottom: 0, paddingTop: 0 }}
        colSpan={Math.floor(columns.length / 2 + 1)}
      >
        <Collapse in={open} timeout="auto" unmountOnExit>
          <Box>
            <Table size="small" aria-label="purchases">
              <TableBody>
                {columns.map((column, i) => {
                  const value = row[column.id];
                  return (i + 1) * 300 >= width ? (
                    <TableRow key={column.id}>
                      <TableCell>{column.label}</TableCell>
                      <TableCell align={"left"}>
                        {typeof value === "string" && value.length > 40 ? (
                          <TruncatedText text={value} />
                        ) : !!column.render ? (
                          column.render(
                            value,
                            column.secondParameter
                              ? column.secondParameter
                              : undefined
                          )
                        ) : (
                          value
                        )}
                      </TableCell>
                    </TableRow>
                  ) : (
                    ""
                  );
                })}
              </TableBody>
            </Table>
          </Box>
        </Collapse>
      </TableCell>
    </React.Fragment>
  );
}

const ExportableTable: React.FunctionComponent<IListItemsHooksProps> = (
  props
) => {
  const classes = useStyles();
  const { width } = useWindowDimensions();
  const [page, setPage] = React.useState(1);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  const [rows, setRows] = useState<RowData[]>([]);
  const [filteredRows, setFilteredRows] = useState<RowData[]>([]);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [expandAll, setExpandAll] = useState(false);
  const [searchObject, setSearchObject] = useState<any>({
    orderId: "",
    name: "",
    amount: "",
    country: "",
    type: "",
    status: "",
    address: "",
    date: "",
  });
  const tableRef = useRef(null);

  useEffect(() => {
    setRows(fakeJsonGenerator(105));
  }, []);

  const exportPDF = (rows: RowData[]) => {
    if (jsPDF !== null) {
      let content = {
        startY: 20,
        head: [columns.map((column) => column.id)],
        body: rows.map((row) => Object.values(row)),
      };
      const doc = new jsPDF("landscape", "pt", "A4");
      doc.setFontSize(15);
      doc.text("Orders Data", 40, 40);
      doc.autoTable(content);
      doc.save("Data-table.pdf");
    } else {
      console.log("its null yaar");
    }
  };

  useEffect(() => {
    if (
      Object.values(searchObject).some(
        (value) => typeof value === "string" && !!value.trim()
      )
    ) {
      let tempFilteredRows: RowData[] = searchByColumn(rows, searchObject);
      setFilteredRows(tempFilteredRows);
    } else {
      setFilteredRows(rows);
    }
  }, [searchObject, rows]);

  const handleRowsPerPageChange = (
    event: React.ChangeEvent<{ value: unknown }>
  ) => {
    setRowsPerPage(event.target.value as number);
    setPage(1);
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  return (
    <Paper
      className={classes.root}
      style={{
        width: width < 600 ? "98%" : undefined,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ width: "120px", margin: "20px" }}>
          <FormControl variant="outlined" style={{ width: "120px" }}>
            <InputLabel id="Rows-Per-Page-Select-label">Display</InputLabel>
            <Select
              labelId="Rows-Per-Page-Select-label"
              id="rows-per-page-select"
              label="Display"
              value={rowsPerPage}
              onChange={handleRowsPerPageChange}
              fullWidth
              margin="dense"
            >
              <MenuItem value={10}>10 Rows</MenuItem>
              <MenuItem value={20}>20 Rows</MenuItem>
              <MenuItem value={50}>50 Rows</MenuItem>
              <MenuItem value={filteredRows.length}>All Rows</MenuItem>
            </Select>
          </FormControl>
          <FormControlLabel
            control={
              <Switch
                checked={expandAll}
                onChange={() => setExpandAll((prev) => !prev)}
              />
            }
            label="Expand"
          />
        </div>

        <Pagination
          style={{
            display: width < 800 ? "none" : "",
          }}
          page={page}
          count={Math.ceil(filteredRows.length / rowsPerPage)}
          onChange={(e, p) => setPage(p)}
          variant="text"
          color="primary"
          shape="rounded"
        />
        <IconButton
          aria-label="more"
          aria-controls="long-menu"
          aria-haspopup="true"
          onClick={handleMenuClick}
        >
          <MoreVertIcon />
        </IconButton>
        <Menu
          id="long-menu"
          anchorEl={anchorEl}
          keepMounted
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
        >
          <CsvDownload
            data={filteredRows}
            style={{
              backgroundColor: "white",
              border: "none",
              outline: "none",
              width: "100%",
              padding: 0,
              margin: 0,
            }}
          >
            <MenuItem>Export CSV</MenuItem>
          </CsvDownload>
          <MenuItem
            onClick={() => {
              exportPDF(filteredRows);
            }}
          >
            Export PDF
          </MenuItem>
          <ReactToPrint
            trigger={() => {
              return <MenuItem> Print Page </MenuItem>;
            }}
            content={() => tableRef.current}
            pageStyle={"padding:20px"}
          />
        </Menu>
      </div>
      <Pagination
        style={{
          display: width > 800 ? "none" : "",
          padding: "10px",
        }}
        page={page}
        count={Math.ceil(filteredRows.length / rowsPerPage)}
        onChange={(e, p) => setPage(p)}
        variant="text"
        color="primary"
        shape="rounded"
        size={width < 400 ? "small" : "medium"}
      />
      <TableContainer>
        <Table aria-label="Table table" ref={tableRef}>
          <TableHead>
            <TableRow>
              <TableCell align={"left"}>#</TableCell>
              {columns.map((column, i) => (
                <>
                  {(i + 1) * 300 < width ? (
                    <TableCell
                      key={column.id}
                      align={"center"}
                      style={{
                        minWidth: column.minWidth,
                        maxWidth: column.maxWidth,
                      }}
                    >
                      {column.label}
                      <TextField
                        variant="outlined"
                        margin="dense"
                        value={searchObject[column.id]}
                        onChange={(e) => {
                          e.persist();
                          console.log(e.target, e.target.value);
                          if (e.target && e.target.value) {
                            setSearchObject((prev: any) => ({
                              ...prev,
                              [column.id]: e.target.value,
                            }));
                          } else {
                            setSearchObject((prev: any) => ({
                              ...prev,
                              [column.id]: "",
                            }));
                          }
                        }}
                      />
                    </TableCell>
                  ) : (
                    ""
                  )}
                </>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredRows
              .slice((page - 1) * rowsPerPage, page * rowsPerPage)
              .map((row, i) => {
                return (
                  <Row row={row} expandAll={expandAll} columns={columns} />
                );
              })}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default ExportableTable;
