import React, { ReactNode, useEffect, useState,useRef } from 'react';
import { SPHttpClient } from '@microsoft/sp-http'
import { Avatar, InputBase } from '@material-ui/core';
import Paper from '@material-ui/core/Paper';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import useWindowDimensions from '../utils/useWindowDimensions';
import { Autocomplete, Pagination } from '@material-ui/lab';
import TruncatedText from "./TruncatedText"
import { Box, Chip, Collapse, FormControl, FormControlLabel, IconButton, InputLabel, MenuItem, Select, Switch, TextField } from '@material-ui/core';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import ArrowRightIcon from '@material-ui/icons/ArrowRight';
import equal from "fast-deep-equal";
import makeNestedObject from './nestedObject';
import GroupData from './GroupData';
import Menu from '@material-ui/core/Menu';
import MoreVertIcon from '@material-ui/icons/MoreVert'
import ReactToPrint from 'react-to-print';
import { Web } from "sp-pnp-js";
import exportFromJSON from 'export-from-json';
import "./style.css";
import moment from 'moment';
const { jsPDF } = require('jspdf');
require('jspdf-autotable');

const renderMethods = {
    "DATE": (value) => value ? moment(value).format("MM/DD/YYYY") : undefined,
    "CURRENCY": (value) => value ? <span style={{ color: "#009BE5" }}>${value} </span> : undefined,
    "USER": (value) => value ? <Chip avatar={<Avatar>{value.toString()[0]}</Avatar>} label={value} /> : "",
    "TRUNCATED-TEXT": (value) => value ? typeof value === "string" && value.length > 40 ? <TruncatedText text={value} /> : value : undefined
}

interface Column {
    id: string;
    label: string;
    secondParameter?:any,
    render?:(value: string | number,secondParameter?:any) => ReactNode,
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


function Row(props: { row: any, columns: Column[], expandAll: boolean,index:number }) {
    const { row,columns,expandAll,index } = props;
    const [open, setOpen] = React.useState(false);
    const { width } = useWindowDimensions();

    useEffect(() => {
        setOpen(expandAll)
    }, [expandAll])

    return (
        <React.Fragment>
            <TableRow hover role="checkbox" tabIndex={-1}>
                <TableCell
                    style={{
                        border: "1px solid #dddddd",
                        width:"40px"
                    }}  
                >
                    {
                        columns.length*200 > width ? (
                            <IconButton aria-label="expand row" size="small" onClick={() => setOpen(!open)}>
                                {open ? <ArrowDropDownIcon /> : <ArrowRightIcon />}
                            </IconButton>
                        ) : (index+1)
                    }
                </TableCell>
                {columns.map((column,i) => {
                    const value = row[column.id];
                    return (
                        (i+1)*200 < width ?
                        <TableCell key={column.id} align={"center"}
                            style={{
                                border: "1px solid #dddddd",
                            }}
                        >
                            {
                                    !!column.render ? column.render(value, column.secondParameter ? column.secondParameter : undefined) : value
                            }
                        </TableCell> : ""
                    );
                })}
            </TableRow>
            <TableCell style={{ paddingBottom: 0, paddingTop: 0, }} colSpan={width > 400 ? 3 : 2 }>
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

const doesSearchValueExists = (row:any, searchValue:string) => {
    let rowItems = Object.values(row).map(item => item.toString());
    const regex = new RegExp(searchValue.toString(), 'gi')
    return rowItems.some(e => !!(typeof e === "string" && e.match(regex)))       
}

export default function GroupByTable(props:any) {
    const { isGroupingEnabled: isDisplayGroupingEnabled, isColumnSearchEnabled, list, selectedExportFunctionalities, selectedColumns, listColumnsWithType } = props
    const [rows, setRows] = useState<any[]>([]);
    const [unfilteredRows, setUnfilteredRows] = useState<any[]>([]);
    const [columns, setColumns] = useState<Column[]>([])
    const [rowsAfterFiltered, setRowsAfterFiltered] = useState<any[]>([]);
    const [rowsAfterGrouped, setRowsAfterGrouped] = useState<any[]>([]);
    const [columnsForMapping, setColumnsForMapping] = useState<Column[]>([]);
    const [groupByHeaders, setGroupByHeaders] = useState<Column[]>([]);
    const [isGroupingEnabled, setIsGroupingEnabled] = useState<boolean>(false);
    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(50);
    const [expandAll, setExpandAll] = useState(false);
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const [searchObject, setSearchObject] = useState<any>({});
    const tableRef = useRef(null)
    const { width } = useWindowDimensions();
    const [displaySearchFields, setDisplaySearchFields] = useState(true);
    const [users, setUsers] = useState({});

    const exportPDF = (rows: any[]) => {
        if (jsPDF !== null) {
            let columnsArr = columns.map(column => column.id);
            let content = {
                startY: 20,
                head: [columnsArr],
                body: rows.map(row => {
                    let arrToReturn = []
                    columnsArr.forEach(head => {
                        arrToReturn.push(row[head])
                    })
                    return arrToReturn
                })
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

    const getUsers = async () => {
        try {
            let data = await props.context.spHttpClient.get(props.context.pageContext.web.absoluteUrl + "/_api/web/siteusers", SPHttpClient.configurations.v1)
            return data.json()            
        } catch (error) {
            console.log(error);
            return error
        }
    }

    const getListItems = async (list) => {
        try {
            let web = new Web(props.context.pageContext.web.absoluteUrl);
            let dataList = await web.lists.getById(list).fields.get()
            dataList.forEach(field => {
                if (!field.Hidden && field["odata.type"] != "SP.FieldComputed" && !field.ReadOnlyField) {
                    console.log(field);
                    console.log(field.InternalName);
                } 
            });
        } catch (error) {
            console.log(error);
            return error 
        }
    }

    useEffect(() => {
        console.log(listColumnsWithType)
        getUsers().then(data => {
            if(data && data.value){
                let json = {}
                data.value.forEach(item => { 
                    json[item.Id] = item.Title
                 })
                 setUsers(json)
            }else {
                console.log(data);
            }
        })
    },[])

    useEffect(() => {
        let web = new Web(props.context.pageContext.web.absoluteUrl);
        web.lists.getById(list).items.top(1000).get().then(data => {
            console.log(data);
            setUnfilteredRows(data);
        }).catch(err => {
            console.log(err);
        })
    }, [list])

    useEffect(() => {
        setRows((prev) => {
            return unfilteredRows.map(row => {
                let objectToReturn = {}
                selectedColumns.forEach(column => {
                    if(!!row[column]){
                        objectToReturn[column] = row[column]
                    }
                });
                return objectToReturn
            })
        })
        setColumns(prev => {
            let finalColumnsArr = []
            if (listColumnsWithType){
                listColumnsWithType.forEach((column) => {
                    if (selectedColumns.includes(column.id)) {
                        finalColumnsArr.push({
                            ...column,
                            render: renderMethods[column.type]
                        })
                    }
                })
            }
            return finalColumnsArr
        })
    }, [unfilteredRows, selectedColumns,listColumnsWithType])

    useEffect(() => {
        setPage(1)
        if (Object.values(searchObject).some(value => typeof value === "string" && !!value.trim())) {
            let tempFilteredRows: any[] = searchByColumn(rows, searchObject)
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
                {
                    isDisplayGroupingEnabled ? (
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
                    ) : ""
                }
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
                    {
                    selectedExportFunctionalities.length ? (
                        <>
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
                    {
                        selectedExportFunctionalities.includes("PDF") ? (
                            <MenuItem
                                onClick={() => {
                                    exportPDF(rowsAfterFiltered);
                                }}
                            >
                                Export PDF
                            </MenuItem>
                        ) : ""
                    }
                    {
                        selectedExportFunctionalities.includes("Excel") ? (
                            <MenuItem
                                onClick={() => exportFromJSON({ data: rowsAfterFiltered, fileName: "export-excel", exportType: exportFromJSON.types.xls })}
                            >
                                Export Excel
                            </MenuItem>
                        ) : ""
                    }
                    {
                        selectedExportFunctionalities.includes("CSV") ? (
                            <MenuItem
                                onClick={() => exportFromJSON({ data: rowsAfterFiltered, fileName: "export-csv", exportType: exportFromJSON.types.csv })}
                            >
                                Export CSV
                            </MenuItem>
                        ) : ""
                    }
                    {
                    selectedExportFunctionalities.includes("Print") ? (
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
                            onBeforeGetContent={() => {
                                setDisplaySearchFields(false)
                                setTimeout(() => {
                                    setDisplaySearchFields(true)
                                }, 1000);
                            }}
                        />
                    ) : ""
                    }
                    </Menu>
                    </>
                    ) : ""
                    }
                </div>
                <Pagination
                    style={{
                        display: width > 800 ? "none" : "block",
                        padding: "10px",
                        margin:"0 auto"
                    }}
                    page={page}
                    count={Math.ceil((rowsAfterFiltered.length) / rowsPerPage)}
                    onChange={(e, p) => setPage(p)}
                    variant="text"
                    color="primary"
                    shape="rounded"
                    siblingCount={1} 
                    size={"small"}
                />                
                <TableContainer 
                    style={{
                        overflowY:"hidden",
                    }}
                >
                <Table aria-label="Data table" ref={tableRef} style={{ borderCollapse:"collapse",tableLayout: "fixed" }} >
                        <TableHead style={{
                        border: "1px solid #dddddd"
                        }} >
                            <TableRow >
                                <TableCell
                                    align={"left"}
                                    className="fixedWidth"
                                style={{
                                    border: "1px solid #dddddd",
                                    width:isGroupingEnabled ? groupByHeaders.length * 5 : "20px"
                                }}
                                >
                                    #
                                </TableCell>
                                {columnsForMapping.map((column, i) => (
                                    <>
                                        {
                                            (i + 1) * 200 < width || isGroupingEnabled ? (
                                                <>
                                                <TableCell
                                                    key={column.id}
                                                    align={"center"}
                                                    style={{
                                                        border: "1px solid #dddddd",
                                                        width: isGroupingEnabled ? "100px" : undefined
                                                    }}
                                                >
                                                    {column.label}
                                                    {
                                                        displaySearchFields && isColumnSearchEnabled ? (
                                                            <InputBase style={{
                                                                border: "1px solid #dddddd",
                                                                borderRadius: "5px"
                                                            }} margin="dense" value={searchObject[column.id]} onChange={(e) => {
                                                                e.persist();
                                                                if (e.target && e.target.value) {
                                                                    setSearchObject((prev: any) => ({ ...prev, [column.id]: e.target.value }))
                                                                } else {
                                                                    setSearchObject((prev: any) => ({ ...prev, [column.id]: "" }))
                                                                }
                                                            }} />
                                                        ) : "" 
                                                    }
                                                </TableCell>
                                                </>
                                            ) : ""
                                        }

                                    </>
                                ))}
                                {
                                    isGroupingEnabled ? (
                                    <TableCell
                                        align={"left"}
                                        className="fixedWidth"
                                        style={{
                                            border: "1px solid #dddddd",
                                            width: isGroupingEnabled ? groupByHeaders.length * 5 : "20px"
                                        }}
                                    >
                                        #
                                    </TableCell>
                                    ) : ""
                                }
                                <>
                                </>
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
                                                        <Row row={row} key={i} index={i} columns={columnsForMapping} expandAll={expandAll} />
                                                )
                                            }
                                        </>
                                    ) : (
                                        <TableCell  colSpan={columns.length + 2} >
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
