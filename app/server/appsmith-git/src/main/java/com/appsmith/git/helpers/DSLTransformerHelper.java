package com.appsmith.git.helpers;

import com.appsmith.git.constants.CommonConstants;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONArray;
import org.json.JSONObject;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.stream.Collectors;


@Component
@RequiredArgsConstructor
@Slf4j
public class DSLTransformerHelper {

    public static Map<String, JSONObject> flatten(JSONObject jsonObject) {
        Map<String, JSONObject> flattenedMap = new HashMap<>();
        flattenObject(jsonObject, CommonConstants.EMPTY_STRING, flattenedMap);
        return new TreeMap<>(flattenedMap);
    }

    private static void flattenObject(JSONObject jsonObject, String prefix, Map<String, JSONObject> flattenedMap) {
        String widgetName = jsonObject.optString(CommonConstants.WIDGET_NAME);
        if (widgetName.isEmpty()) {
            return;
        }

        JSONArray children = jsonObject.optJSONArray(CommonConstants.CHILDREN);
        if (children != null) {
            // Check if the children object has type=CANVAS_WIDGET
            jsonObject = removeChildrenIfNotCanvasWidget(jsonObject);
            flattenedMap.put(prefix + widgetName, jsonObject);

            for (int i = 0; i < children.length(); i++) {
                JSONObject childObject = children.getJSONObject(i);
                String childPrefix = prefix + widgetName + CommonConstants.DELIMITER_POINT;
                flattenObject(childObject, childPrefix, flattenedMap);
            }
        } else {
            flattenedMap.put(prefix + widgetName, jsonObject);
        }
    }

    private static JSONObject removeChildrenIfNotCanvasWidget(JSONObject jsonObject) {
        JSONArray children = jsonObject.optJSONArray(CommonConstants.CHILDREN);
        if (children.length() == 1) {
            JSONObject child = children.getJSONObject(0);
            if (!CommonConstants.CANVAS_WIDGET.equals(child.optString(CommonConstants.WIDGET_TYPE))) {
                jsonObject.remove(CommonConstants.CHILDREN);
            } else {
                JSONObject childCopy = new JSONObject(child.toString());
                childCopy.remove(CommonConstants.CHILDREN);
                JSONArray jsonArray = new JSONArray();
                jsonArray.put(childCopy);
                jsonObject.put(CommonConstants.CHILDREN, jsonArray);
            }
        } else {
            jsonObject.remove(CommonConstants.CHILDREN);
        }
        return jsonObject;
    }

    public static boolean hasChildren(JSONObject jsonObject) {
        JSONArray children = jsonObject.optJSONArray(CommonConstants.CHILDREN);
        return children != null && children.length() > 0;
    }

    public static Map<String, List<String>> calculateParentDirectories(List<String> paths) {
        Map<String, List<String>> parentDirectories = new HashMap<>();

        paths = paths.stream().map(currentPath -> currentPath.replace(".json", "")).collect(Collectors.toList());
        for (String path : paths) {
            String[] directories = path.split("/");
            int lastDirectoryIndex = directories.length - 1;

            if (lastDirectoryIndex > 0 && directories[lastDirectoryIndex].equals(directories[lastDirectoryIndex - 1])) {
                if (lastDirectoryIndex - 2 >= 0) {
                    String parentDirectory = directories[lastDirectoryIndex - 2];
                    List<String> pathsList = parentDirectories.getOrDefault(parentDirectory, new ArrayList<>());
                    pathsList.add(path);
                    parentDirectories.put(parentDirectory, pathsList);
                }
            } else {
                String parentDirectory = directories[lastDirectoryIndex - 1];
                List<String> pathsList = parentDirectories.getOrDefault(parentDirectory, new ArrayList<>());
                pathsList.add(path);
                parentDirectories.put(parentDirectory, pathsList);
            }
        }

        return parentDirectories;
    }

    /*
     * /Form1/Button1.json,
     * /List1/List1.json,
     * /List1/Container1/Text2.json,
     * /List1/Container1/Image1.json,
     * /Form1/Button2.json,
     * /List1/Container1/Text1.json,
     * /Form1/Text3.json,
     * /Form1/Form1.json,
     * /List1/Container1/Container1.json,
     * /MainContainer.json
     * HashMap 1 - ParentName and keyName mapping
     * Loop through the map and create a nested JSON
     */
    public static JSONObject getNestedDSL(Map<String, JSONObject> jsonMap, Map<String, List<String>> pathMapping) {
        // start from the root
        JSONObject dsl = jsonMap.get("/MainContainer.json");
        for (String path : pathMapping.get("MainContainer")) {
            JSONObject child = getChildren(path, jsonMap, pathMapping);
            JSONArray children = dsl.optJSONArray("children");
            if (children == null) {
                children = new JSONArray();
                children.put(child);
                dsl.put("children", children);
            } else {
                children.put(child);
            }
        }
        return dsl;
    }

    public static JSONObject getChildren(String pathToWidget, Map<String, JSONObject> jsonMap, Map<String, List<String>> pathMapping) {
        // Recursively get the children
        List<String>  children =  pathMapping.get(getWidgetName(pathToWidget));
        JSONObject parentObject = jsonMap.get(pathToWidget + CommonConstants.JSON_EXTENSION);
        if (children != null) {
            JSONArray childArray = parentObject.optJSONArray("children");
            if (childArray == null) {
                childArray = new JSONArray();
            }
            for (String childWidget : children) {
                childArray.put(getChildren(childWidget, jsonMap, pathMapping));
            }
            parentObject.put("children", childArray);
        }

        return parentObject;
    }

    public static String getWidgetName(String path) {
        String[] directories = path.split("/");
        return directories[directories.length - 1];
    }
}