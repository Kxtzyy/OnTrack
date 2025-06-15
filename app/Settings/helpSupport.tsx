import React from "react";
import { View, Text, ScrollView, StyleSheet, SafeAreaView } from "react-native";
import { useTheme } from "../Contexts/ThemeContext";

export default function HelpSupport() {
  const { currentTheme } = useTheme();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 16,
    },
    header: {
      fontSize: 24,
      fontWeight: "bold",
      marginBottom: 16,
    },
    faqItem: {
      marginBottom: 20,
    },
    question: {
      fontSize: 18,
      fontWeight: "bold",
      marginBottom: 8,
    },
    answer: {
      fontSize: 16,
      lineHeight: 22,
    },
  });

  const faqs = [
    {
      question: "What is OnTrack?",
      answer:
        "OnTrack is a mobile app that helps users track their habits and activities. It emphasizes customisability and a user friendly design, allowing users to log activities such as food consumption, exercise, hobbies, and more.",
    },
    {
      question: "How do I create a custom tracker?",
      answer:
        "To create a custom tracker, navigate to the 'Create Tracker' section in the app. You can choose from various types of trackers, set goals, and customize the appearance to suit your preferences.",
    },
    {
      question: "Can I use OnTrack offline?",
      answer:
        "Yes, OnTrack is fully functional offline. All data is stored locally using SQLite and will sync with the cloud when you reconnect to the internet.",
    },
    {
      question: "How is my data secured?",
      answer:
        "OnTrack ensures data security by using encrypted storage and secure API requests. Sensitive data, such as passwords, is encrypted using bcrypt.",
    },
    {
      question: "Can I delete my account and data?",
      answer:
        "Yes, you can delete your account and all associated data permanently from the settings page. This ensures compliance with privacy regulations.",
    },
    {
      question: "What platforms does OnTrack support?",
      answer:
        "OnTrack is a multiplatform app that works on Android, iOS, and the web, ensuring compatibility across devices.",
    },
    {
      question: "How can I get help or report an issue?",
      answer:
        "You can contact support or report an issue directly at our email: Support@Ontrack.com",
    },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: currentTheme.black }}>
      <ScrollView
        style={[styles.container]}
        contentContainerStyle={{ paddingBottom: 20 }} // optional: add bottom padding if needed
      >
        <Text style={[styles.header, { color: currentTheme["FFFFFF"] }]}>
          FAQs
        </Text>
        {faqs.map((faq, index) => (
          <View key={index} style={styles.faqItem}>
            <Text style={[styles.question, { color: currentTheme["FFFFFF"] }]}>
              {faq.question}
            </Text>
            <Text
              style={[
                styles.answer,
                { color: currentTheme.gray },
              ]}
            >
              {faq.answer}
            </Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}