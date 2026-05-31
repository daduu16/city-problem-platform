import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useMemo, useState } from "react";
import {
	FlatList,
	Pressable,
	StyleSheet,
	Text,
	TextInput,
	View,
} from "react-native";

import NewsCard from "@/components/NewsCard";
import {
	BorderRadius,
	Color,
	Shadow,
	Spacing,
	Typography,
} from "@/GlobalStyles";
import { HomeStackParamList } from "@/navigation/AppNavigator";
import { useAppData } from "@/state/AppDataContext";

type Props = NativeStackScreenProps<HomeStackParamList, "HomeMain">;

export default function HomeScreen({ navigation }: Props) {
	const { news, unreadNotificationsCount } = useAppData();
	const [query, setQuery] = useState("");

	const filteredNews = useMemo(() => {
		const q = query.trim().toLowerCase();
		if (!q) return news;
		return news.filter((item) =>
			`${item.title} ${item.summary} ${item.description}`
				.toLowerCase()
				.includes(q),
		);
	}, [news, query]);

	return (
		<SafeAreaView style={styles.safeArea}>
			<View style={styles.screen}>
				<View style={styles.header}>
					<View style={styles.searchBox}>
						<Ionicons
							name="search-outline"
							size={20}
							color={Color.neutral500}
						/>
						<TextInput
							placeholder="Xəbər axtar..."
							placeholderTextColor={Color.neutral500}
							value={query}
							onChangeText={setQuery}
							style={styles.searchInput}
						/>
					</View>

					<Pressable
						accessibilityRole="button"
						onPress={() => navigation.navigate("Notifications")}
						style={styles.notifButton}
					>
						<Ionicons
							name="notifications-outline"
							size={22}
							color={Color.neutral900}
						/>
						{unreadNotificationsCount > 0 ? (
							<View style={styles.notifDot}>
								<Text style={styles.notifDotText}>
									{unreadNotificationsCount > 9
										? "9+"
										: unreadNotificationsCount}
								</Text>
							</View>
						) : null}
					</Pressable>
				</View>

				<FlatList
					data={filteredNews}
					keyExtractor={(item) => item.id}
					contentContainerStyle={styles.listContent}
					showsVerticalScrollIndicator={false}
					ItemSeparatorComponent={() => <View style={{ height: Spacing.lg }} />}
					ListHeaderComponent={
						<View style={styles.listHeader}>
							<Text style={styles.title}>Xəbərlər</Text>
							<Text style={styles.subtitle}>Səhərdə bas verən yeniliklər</Text>
						</View>
					}
					renderItem={({ item }) => (
						<NewsCard
							item={item}
							onPress={() => navigation.navigate("NewsDetail", { news: item })}
						/>
					)}
				/>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safeArea: { backgroundColor: Color.neutral50, flex: 1 },
	screen: { backgroundColor: Color.neutral50, flex: 1 },
	header: {
		alignItems: "center",
		flexDirection: "row",
		gap: Spacing.md,
		paddingHorizontal: Spacing.lg,
		paddingTop: Spacing.md,
	},
	searchBox: {
		alignItems: "center",
		backgroundColor: Color.white500,
		borderColor: Color.neutral200,
		borderRadius: BorderRadius.lg,
		borderWidth: 1,
		flex: 1,
		flexDirection: "row",
		gap: Spacing.sm,
		height: 48,
		paddingHorizontal: Spacing.md,
		...Shadow.surface,
	},
	searchInput: {
		color: Color.neutral900,
		flex: 1,
		fontSize: Typography.body,
		fontWeight: "600",
		minWidth: 0,
	},
	notifButton: {
		alignItems: "center",
		backgroundColor: Color.white500,
		borderColor: Color.neutral200,
		borderRadius: 16,
		borderWidth: 1,
		height: 48,
		justifyContent: "center",
		width: 48,
		...Shadow.surface,
	},
	notifDot: {
		backgroundColor: Color.danger500,
		borderRadius: 9,
		minWidth: 18,
		height: 18,
		alignItems: "center",
		justifyContent: "center",
		position: "absolute",
		right: 8,
		top: 8,
		paddingHorizontal: 4,
	},
	notifDotText: {
		color: Color.white500,
		fontSize: 10,
		fontWeight: "900",
		lineHeight: 12,
	},
	listContent: {
		paddingBottom: 24,
		paddingHorizontal: Spacing.lg,
		paddingTop: Spacing.xl,
	},
	listHeader: { marginBottom: Spacing.lg },
	title: { color: Color.neutral900, fontSize: 24, fontWeight: "900" },
	subtitle: {
		color: Color.neutral500,
		fontSize: Typography.body,
		fontWeight: "600",
		marginTop: 6,
	},
	pressed: { opacity: 0.86 },
});
