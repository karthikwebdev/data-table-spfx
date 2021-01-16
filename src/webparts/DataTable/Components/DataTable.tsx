import React, { ReactNode, useEffect, useState,useRef } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Paper from '@material-ui/core/Paper';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import fakeJsonGenerator from '../utils/fakeJsonGenerator';
import useWindowDimensions from '../utils/useWindowDimensions';
import { Autocomplete, Pagination } from '@material-ui/lab';
import TruncatedText from "./TruncatedText"
import { Box, Chip, Collapse, FormControl, FormControlLabel, IconButton, InputLabel, MenuItem, Select, Switch, TextField } from '@material-ui/core';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import ArrowRightIcon from '@material-ui/icons/ArrowRight';
import equal from "fast-deep-equal";
import makeNestedObject from './nestedObject';
import GroupData from './GroupData';
import CsvDownload from 'react-json-to-csv';
import Menu from '@material-ui/core/Menu';
import MoreVertIcon from '@material-ui/icons/MoreVert'
import ReactToPrint from 'react-to-print';
import pnp, { Item, Web } from "sp-pnp-js";
import { UrlQueryParameterCollection } from '@microsoft/sp-core-library';

const { jsPDF } = require('jspdf');
require('jspdf-autotable');



interface Column {
    id: keyof RowData;
    label: string;
    align?: "right" | "left" | "center" | "inherit" | "justify" | undefined
    minWidth?:number,
    maxWidth?:number,
    isNumeric?:boolean,
    secondParameter?:any,
    render?:(value: string | number,secondParameter?:any) => ReactNode
}

interface RowData {
    orderId: string,
    name: string,
    amount:number,
    country: string,
    type: string,
    status: string,
    address: string,
    date: string,
}

const searchByColumn = (rows:any, searchObject:any) => {
    let columnsToSearch = Object.keys(searchObject).filter(
        (value) => !!searchObject[value].trim()
    );
    return rows.filter((row:any) =>
        columnsToSearch.every((column) => {
            let regex = new RegExp(
                searchObject[column].toString().split("\\").join(""),
                "gi"
            );
            return row[column].toString().match(regex);
        })
    );
};


function Row(props: { row: RowData, columns: Column[], expandAll: boolean }) {
    const { row,columns,expandAll } = props;
    const [open, setOpen] = React.useState(false);
    const { width } = useWindowDimensions();

    useEffect(() => {
        setOpen(expandAll)
    }, [expandAll])

    return (
        <React.Fragment>
            <TableRow hover role="checkbox" tabIndex={-1} key={row.orderId}>
                <TableCell>
                    {
                        columns.length*200 > width ? (
                            <IconButton aria-label="expand row" size="small" onClick={() => setOpen(!open)}>
                                {open ? <ArrowDropDownIcon /> : <ArrowRightIcon />}
                            </IconButton>
                        ) : ""
                    }
                </TableCell>
                {columns.map((column,i) => {
                    const value = row[column.id];
                    return (
                        (i+1)*200 <width ?
                        <TableCell key={column.id} align={column.align}>
                            {
                                    !!column.render ? column.render(value, column.secondParameter ? column.secondParameter : undefined) : value
                            }
                        </TableCell> : ""
                    );
                })}
            </TableRow>
            <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={Math.floor((columns.length/2) +1)}>
                <Collapse in={open} timeout="auto" unmountOnExit>
                    <Box>
                        <Table size="small" aria-label="purchases" >                 
                            <TableBody>
                                    {columns.map((column,i) => {
                                        const value = row[column.id];
                                        return (
                                            (i+1)*200 >= width ? (
                                                <TableRow key={column.id} >
                                                    <TableCell>
                                                        {column.label}
                                                    </TableCell>
                                                    <TableCell align={"left"}>
                                                        {
                                                            typeof value === "string" && value.length > 40 ? <TruncatedText text={value} /> : !!column.render ? column.render(value, column.secondParameter ? column.secondParameter : undefined) : value
                                                        }
                                                    </TableCell>
                                                </TableRow>
                                            ) : ""
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

const doesSearchValueExists = (row:RowData, searchValue:string) => {
    let rowItems = Object.values(row).map(item => item.toString());
    const regex = new RegExp(searchValue.toString(), 'gi')
    return rowItems.some(e => !!(typeof e === "string" && e.match(regex)))       
}

export default function GroupByTable(props:any) {
    const { width } = useWindowDimensions();
    const [rows, setRows] = useState<RowData[]>([]);
    const [columns, setColumns] = useState<Column[]>([
        { id: 'orderId', label: 'OrderId' },
        { id: 'name', label: 'Name', },
        { id: 'amount', label: 'Amount', isNumeric: true, render: (value) => <span style={{ color: "#009BE5" }}>US${value} </span> },
        {
            id: 'date',
            label: 'Date',
            align: 'right',
        },
        {
            id: "address",
            label: 'Address',
            minWidth: 50,
            maxWidth: 100,
            align: 'left',
            render: (value) => typeof value === "string" && value.length > 40 ? <TruncatedText text={value} /> : value
        },
        {
            id: "country",
            label: 'Country',
            align: 'left',
        },
        {
            id: "status",
            label: 'Status',
            align: 'center',
            secondParameter: {
                Danger: "#E21717",
                Pending: "#207398",
                Success: "#3DBE29",
                Cancelled: "#758283",
                Info: "#E07C24",
            },
            render: (value, colors) => <Chip label={value} style={{
                backgroundColor: colors ? colors[value] : "",
                color: "white"
            }} size="small" />
        },
        {
            id: "type",
            label: 'Type',
            align: 'center',
            secondParameter: {
                "Online": "#3DBE29",
                "Retail": "#E07C24",
                "Direct": "#758283"
            },
            render: (value, colors) => (<span
                style={{ color: colors[value] }}
            >
                {value}
            </span>)
        },
    ])
    const [rowsAfterFiltered, setRowsAfterFiltered] = useState<RowData[]>([]);
    const [rowsAfterGrouped, setRowsAfterGrouped] = useState<RowData[]>([]);
    const [columnsForMapping, setColumnsForMapping] = useState<Column[]>([]);
    const [groupByHeaders, setGroupByHeaders] = useState<Column[]>([]);
    const [isGroupingEnabled, setIsGroupingEnabled] = useState<boolean>(false);
    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [expandAll, setExpandAll] = useState(false);
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
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
    const tableRef = useRef(null)

    const exportPDF = (rows: RowData[]) => {
        if (jsPDF !== null) {
            let content = {
                startY: 20,
                head: [columns.map(column => column.id)],
                body: rows.map(row => Object.values(row))
            }
            const doc = new jsPDF("landscape", "pt", "A4");
            doc.setFontSize(15);
            doc.text("Orders Data", 40, 40);
            doc.autoTable(content);
            doc.save("Data-table.pdf");
        } else {
            console.log("its null yaar")
        }
    }

    const handleRowsPerPageChange = (event: React.ChangeEvent<{ value: unknown }>) => {
        setRowsPerPage(event.target.value as number);
        setPage(1)
    };

    const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    useEffect(() => {
        let web = new Web(props.context.pageContext.web.absoluteUrl);
        // var queryParms = new UrlQueryParameterCollection(window.location.href);
        // web.lists.getByTitle("Orders").items.top(100).get().
    },[])

    useEffect(() => {
        setPage(1)
        if (Object.values(searchObject).some(value => typeof value === "string" && !!value.trim())) {
            let tempFilteredRows: RowData[] = searchByColumn(rows, searchObject)
            setRowsAfterFiltered(tempFilteredRows);
        } else {
            setRowsAfterFiltered(rows)
        }
    }, [searchObject, rows, rowsPerPage])

    useEffect(() => {
        if(isGroupingEnabled){
            setRowsAfterGrouped(makeNestedObject(groupByHeaders.map(column => column.id), 0, rowsAfterFiltered.slice((page - 1) * rowsPerPage, page * rowsPerPage)));
        }
    }, [isGroupingEnabled,groupByHeaders,rowsAfterFiltered,page,rowsPerPage])

    useEffect(() => {
        if(groupByHeaders.length){
            setIsGroupingEnabled(true)
            let newColumns = [...groupByHeaders];
            columns.forEach(column=> {
                let isAlreadyIncluded = false
                for(let selectedColumn of newColumns){
                    if(equal(column,selectedColumn)){
                        isAlreadyIncluded = true
                        break
                    }
                }
                if(!isAlreadyIncluded){
                    newColumns.push(column)
                }
            })
            setColumnsForMapping(newColumns);
        } else {
        setIsGroupingEnabled(false)
        setColumnsForMapping(columns);
        }
    }, [groupByHeaders,columns])

    return (
            <Paper>
                <div style={{ padding: "20px", display: "flex", flexDirection: width < 700 ? "column" : "row" }}>
                    <Autocomplete
                        multiple
                        id="headers-autocomplete"
                        style={{
                            width: "100%",
                        }}
                        value={groupByHeaders}
                        onChange={(e, v: Column[]) => {
                            setGroupByHeaders(v);
                        }}
                        limitTags={3}
                        options={columns}
                        getOptionLabel={(option: Column) => option.label}
                        filterSelectedOptions
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                variant="outlined"
                                label="Group By Headers"
                                placeholder="Select Header"
                            />
                        )}
                        renderTags={(value, getTagProps) =>
                            value.map((option, index) => (
                                <Chip
                                    variant="outlined"
                                    color="primary"
                                    label={option.label}
                                    {...getTagProps({ index })}
                                />
                            ))
                        }
                    />
                </div>
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between"
                    }}
                >
                    <div
                        style={{ width: "120px", margin: "20px" }}
                    >
                        <FormControl variant="outlined" style={{ width: "120px" }}>
                            <InputLabel id="Rows-Per-Page-Select-label" >Display</InputLabel>
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
                            </Select>
                        </FormControl>
                        <FormControlLabel
                            control={<Switch checked={expandAll} onChange={() => setExpandAll(prev => !prev)} />}
                            label="Expand"
                        />
                    </div>

                    <Pagination
                        style={{
                            display: width < 800 ? "none" : ""
                        }}
                        page={page}
                        count={Math.ceil((rowsAfterFiltered.length) / rowsPerPage)}
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
                        <CsvDownload data={rowsAfterFiltered} style={{
                            backgroundColor: "white",
                            border: "none",
                            outline: "none",
                            width: "100%",
                            padding: 0,
                            margin: 0
                        }} >
                            <MenuItem>
                                Export CSV
                        </MenuItem>
                        </CsvDownload>
                        <MenuItem
                            onClick={() => {
                                exportPDF(rowsAfterFiltered);
                            }}
                        >
                            Export
                    </MenuItem>
                        <ReactToPrint
                            trigger={() => {
                                return (
                                    <MenuItem
                                    >
                                        Print Page
                                    </MenuItem>
                                );
                            }}
                            content={() => tableRef.current}
                            pageStyle={"padding:20px"}
                        />
                    </Menu>
                </div>
                <Pagination
                    style={{
                        display: width > 800 ? "none" : "",
                        padding: "10px"
                    }}
                    page={page}
                    count={Math.ceil((rowsAfterFiltered.length) / rowsPerPage)}
                    onChange={(e, p) => setPage(p)}
                    variant="text"
                    color="primary"
                    shape="rounded"
                    size={width < 400 ? "small" : "medium"}
                />
                <TableContainer >
                    <Table aria-label="Data table" ref={tableRef}>
                        <TableHead>
                            <TableRow >
                                {
                                    isGroupingEnabled ? "" : (
                                        <TableCell
                                            align={"left"}
                                        >
                                            #
                                        </TableCell>
                                    )
                                }

                                {columnsForMapping.map((column, i) => (
                                    <>
                                        {
                                            (i + 1) * 200 < width ? (
                                                <TableCell
                                                    key={column.id}
                                                    align={"center"}
                                                    style={{
                                                        minWidth: column.minWidth,
                                                        maxWidth: column.maxWidth,
                                                    }}
                                                >
                                                    {column.label}
                                                    <TextField variant="outlined" margin="dense" value={searchObject[column.id]} onChange={(e) => {
                                                        e.persist();
                                                        if (e.target && e.target.value) {
                                                            setSearchObject((prev: any) => ({ ...prev, [column.id]: e.target.value }))
                                                        } else {
                                                            setSearchObject((prev: any) => ({ ...prev, [column.id]: "" }))
                                                        }
                                                    }} />
                                                </TableCell>
                                            ) : ""
                                        }

                                    </>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            <>
                                {
                                    !isGroupingEnabled ? (
                                        <>
                                            {
                                                rowsAfterFiltered.slice((page - 1) * rowsPerPage, page * rowsPerPage).map(
                                                    (row, i) =>
                                                        <Row row={row} key={i} columns={columnsForMapping} expandAll={expandAll} />
                                                )
                                            }
                                        </>
                                    ) : (
                                            <TableCell colSpan={columns.length + 1} >
                                                <GroupData data={rowsAfterGrouped} columns={columnsForMapping} index={0} isExpandAllEnabled={expandAll} />
                                            </TableCell>
                                        )
                                }
                            </>
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
    );
}
