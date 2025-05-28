import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import {
  BodyL,
  BodyS,
  H1,
  H2,
  H3,
  TitleM,
  Typography,
  TypographyButtonL,
} from "./ui/Typography";

export function FontTest() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Typography variant="h2" style={styles.sectionTitle}>
          Font Loading Test
        </Typography>

        <View style={styles.fontGroup}>
          <Typography variant="h3" style={styles.groupTitle}>
            Poppins Font Family
          </Typography>
          <H1>H1 - Poppins SemiBold</H1>
          <H2>H2 - Poppins SemiBold</H2>
          <H3>H3 - Poppins SemiBold</H3>
        </View>

        <View style={styles.fontGroup}>
          <Typography variant="h3" style={styles.groupTitle}>
            Inter Font Family
          </Typography>
          <TitleM>Title Medium - Inter SemiBold</TitleM>
          <BodyL>Body Large - Inter Medium</BodyL>
          <BodyS>Body Small - Inter Medium</BodyS>
          <TypographyButtonL>Button Large - Inter Bold</TypographyButtonL>
        </View>

        <View style={styles.fontGroup}>
          <Typography variant="h3" style={styles.groupTitle}>
            Font Weight Test
          </Typography>
          <Typography variant="body-s-regular">
            Regular Weight - Inter Regular
          </Typography>
          <Typography variant="body-s">Medium Weight - Inter Medium</Typography>
          <Typography variant="body-s-bold">
            Bold Weight - Inter Bold
          </Typography>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    marginBottom: 30,
    textAlign: "center",
    color: "#333",
  },
  fontGroup: {
    marginBottom: 30,
    padding: 15,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
  },
  groupTitle: {
    marginBottom: 15,
    color: "#666",
  },
});
