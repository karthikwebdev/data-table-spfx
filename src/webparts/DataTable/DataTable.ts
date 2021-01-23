import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import {
  IPropertyPaneConfiguration,
  IPropertyPaneDropdownOption,
  PropertyPaneToggle,
} from '@microsoft/sp-property-pane';
import { Web } from "sp-pnp-js";
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import { PropertyFieldMultiSelect } from '@pnp/spfx-property-controls/lib/PropertyFieldMultiSelect';
import { PropertyFieldListPicker, PropertyFieldListPickerOrderBy } from '@pnp/spfx-property-controls/lib/PropertyFieldListPicker';

import * as strings from 'ListItemsHooksWebPartStrings';
import DataTable from './Components/DataTable';

export interface IListItemsHooksWebPartProps {
  list: string;
  isGroupingEnabled:boolean;
  isColumnSearchEnabled:boolean;
  name:string;
  selectedExportFunctionalities: string[];
  selectedColumns: string[];
}

export default class ListItemsHooksWebPart extends BaseClientSideWebPart<IListItemsHooksWebPartProps> {
  private listColumns: IPropertyPaneDropdownOption[];
  public render(): void {
    const element: React.ReactElement = React.createElement(
      DataTable,
      {
        isGroupingEnabled:this.properties.isGroupingEnabled,
        isColumnSearchEnabled:this.properties.isColumnSearchEnabled,
        list:this.properties.list,
        selectedExportFunctionalities:this.properties.selectedExportFunctionalities,
        selectedColumns:this.properties.selectedColumns,
        context: this.context,
      }
    );

    ReactDom.render(element, this.domElement);
  }

  protected async onPropertyPaneFieldChanged(path,oldValue,newValue) {
    if(path === "list" && (oldValue !== newValue)){
      let web = new Web(this.context.pageContext.web.absoluteUrl);
      let columnsOfList = await web.lists.getById(newValue).fields.get()
      let finalColumnstoSelect = []
      columnsOfList.forEach(field => {
        if ((
              field.Title == "Modified" || 
              field.Title == "Created" || 
              field.Title == "Created By" || 
              field.Title == "Modified By"
            ) || 
            (!field.Hidden && field["odata.type"] != "SP.FieldComputed" && !field.ReadOnlyField)
          ) {
          console.log(field);
          console.log(field.InternalName);
          finalColumnstoSelect.push({ key: field.InternalName, text:field.Title })
        }
      })
      this.listColumns = finalColumnstoSelect;
      this.context.propertyPane.refresh();
      this.render();
    }
  }

  protected async onPropertyPaneConfigurationStart() {
  try {
    let web = new Web(this.context.pageContext.web.absoluteUrl);
    let columnsOfList = await web.lists.getById(this.properties.list).fields.get()
    let finalColumnstoSelect = []
    columnsOfList.forEach(field => {
      if ((
        field.Title == "Modified" ||
        field.Title == "Created" ||
        field.Title == "Created By" ||
        field.Title == "Modified By"
      ) ||
        (!field.Hidden && field["odata.type"] != "SP.FieldComputed" && !field.ReadOnlyField)
      ) {
        console.log(field);
        console.log(field.InternalName);
        finalColumnstoSelect.push({ key: field.InternalName, text: field.Title })
      }
    })
    this.listColumns = finalColumnstoSelect;
    this.context.propertyPane.refresh();
    this.render();
  } catch (error) {
    console.log(error)
  }

  }


  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }



  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: {
            description: strings.PropertyPaneDescription
          },
          groups: [
            {
              groupName: strings.BasicGroupName,
              groupFields: [
                PropertyFieldListPicker('list', {
                  label: 'Select a list',
                  selectedList: this.properties.list,
                  includeHidden: false,
                  orderBy: PropertyFieldListPickerOrderBy.Title,
                  disabled: false,
                  onPropertyChange: this.onPropertyPaneFieldChanged.bind(this),
                  properties: this.properties,
                  context: this.context,
                  onGetErrorMessage: null,
                  deferredValidationTime: 0,
                  key: 'listPickerFieldId'
                }),
                PropertyFieldMultiSelect('selectedColumns', {
                  key: 'selectedColumns',
                  label: "Select Columns to display in grid",
                  options: this.listColumns,
                  selectedKeys: this.properties.selectedColumns
                }),
                PropertyPaneToggle("isGroupingEnabled",{
                  label:strings.GroupingToggleLabel
                }),
                PropertyPaneToggle("isColumnSearchEnabled", {
                  label: strings.ColumnSearchToggleLabel
                }),
                PropertyFieldMultiSelect('selectedExportFunctionalities', {
                  key: 'selectedExportFunctionalities',
                  label: strings.selectedExportFunctionalitiesLabel,
                  options: [
                    { key: "CSV", text: "CSV" },
                    { key: "PDF", text: "PDF" },
                    { key: "Print", text: "Print" },
                    { key: "Excel", text: "Excel" }
                  ],
                  selectedKeys: this.properties.selectedExportFunctionalities
                }),
              ]
            }
          ]
        }
      ]
    };
  }
}
