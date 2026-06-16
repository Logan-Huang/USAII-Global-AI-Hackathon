# kotlinx.serialization keeps generated serializers via @Serializable; preserve them.
-keepattributes *Annotation*, InnerClasses
-dontnote kotlinx.serialization.**
-keepclassmembers class org.asylumaid.model.** {
    *** Companion;
}
-keepclasseswithmembers class org.asylumaid.model.** {
    kotlinx.serialization.KSerializer serializer(...);
}

# osmdroid uses some reflection for tile sources.
-keep class org.osmdroid.** { *; }
-dontwarn org.osmdroid.**
